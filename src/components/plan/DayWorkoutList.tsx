import DraggableCardList from '@/components/shared/DraggableCardList';
import WorkoutCard from '@/components/shared/WorkoutCard';
import WorkoutPicker from '@/components/plan/WorkoutPicker';
import { useTheme } from '@/context/ThemeContext';
import { addWorkoutToSplit, deleteWorkout, updateSplit } from '@/storage';
import { radius, spacing, type Palette } from '@/styles';
import type { DayKey, Exercise, Split, Workout } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

interface DayWorkoutListProps {
  split: Split;
  day: DayKey; // the currently selected day
  dayWorkouts: Workout[]; // that day's workouts, already resolved from ids
  standaloneWorkouts: Workout[]; // candidates for the "add existing" picker
  allExercises: Exercise[];
  onChanged: () => void; // ask the owning screen to reload after a storage mutation
}

// The inline section revealed beneath a SplitCard when a day is selected. Owns all per-day
// workout mutations directly (add / remove) and the picker, so the parent only needs to be
// told when to refresh. Editing/creating a workout navigates to the workout editor screen.
export default function DayWorkoutList({
  split,
  day,
  dayWorkouts,
  standaloneWorkouts,
  allExercises,
  onChanged,
}: DayWorkoutListProps) {
  const { colors, layout, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  // Assign an existing standalone workout to this day as a fully decoupled copy — editing or
  // deleting it never touches the original. The exercises are deep-copied so the embedded copy
  // shares no array references with the source; addWorkoutToSplit persists it as isStandalone: false.
  async function handleAddStandalone(sourceWorkout: Workout) {
    await addWorkoutToSplit(split.id, day, {
      name: sourceWorkout.name,
      exercises: sourceWorkout.exercises.map((workoutExercise) => ({
        exerciseId: workoutExercise.exerciseId,
        sets: workoutExercise.sets.map((set) => ({ minReps: set.minReps, maxReps: set.maxReps })),
      })),
    });
    onChanged();
  }

  // Build a brand-new embedded workout for this day — the editor screen creates it and attaches
  // it via the splitId/day query params, so we just navigate (focus reload handles the refresh).
  function handleCreateNew() {
    router.push(`/plan/workout/new?splitId=${split.id}&day=${day}`);
  }

  async function handleDeleteWorkout(workoutId: string) {
    await updateSplit({
      ...split,
      days: { ...split.days, [day]: split.days[day].filter((id) => id !== workoutId) },
    });
    // The embedded copy is referenced only by this day, so removing the link also deletes it.
    await deleteWorkout(workoutId);
    onChanged();
  }

  function confirmRemove(workout: Workout) {
    Alert.alert('Remove workout?', `Remove "${workout.name}" from this day?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => handleDeleteWorkout(workout.id) },
    ]);
  }

  async function handleReorder(reordered: Workout[]) {
    await updateSplit({
      ...split,
      days: { ...split.days, [day]: reordered.map((workout) => workout.id) },
    });
    onChanged();
  }

  return (
    <View>
      {dayWorkouts.length === 0 ? (
        <Text style={[typography.caption, styles.emptyHint]}>No workouts on this day yet.</Text>
      ) : (
        <DraggableCardList
          data={dayWorkouts}
          keyExtractor={(item) => item.id}
          onReorder={handleReorder}
          separatorHeight={spacing.s}
          renderCard={(workout, drag) => (
            <View style={layout.row}>
              <View style={styles.cardSlot}>
                {/* WorkoutCard is Pressable-rooted, so pass drag directly as onLongPress. */}
                <WorkoutCard workout={workout} allExercises={allExercises} onLongPress={drag} />
              </View>
              <Pressable
                onPress={() => confirmRemove(workout)}
                hitSlop={8}
                style={({ pressed }) => [styles.removeButton, pressed && layout.pressedButton]}
              >
                <Ionicons name="close" size={18} color={colors.error} />
              </Pressable>
            </View>
          )}
        />
      )}

      {/* The add button aligns to the workout-card column only — the empty spacer reserves the
          remove (✕) column so adding never sits under the opposite-meaning delete action. */}
      <View style={[layout.row, styles.addRow]}>
        <Pressable
          onPress={() => setIsPickerVisible(true)}
          style={({ pressed }) => [layout.addButton, styles.compactAddButton, pressed && layout.pressedButton]}
        >
          <Ionicons name="add" size={18} color={colors.primary} />
          <Text style={styles.addLabel}>Add workout</Text>
        </Pressable>
        <View style={styles.removeColumn} />
      </View>

      <WorkoutPicker
        visible={isPickerVisible}
        standaloneWorkouts={standaloneWorkouts}
        allExercises={allExercises}
        onSelect={handleAddStandalone}
        onCreateNew={handleCreateNew}
        onClose={() => setIsPickerVisible(false)}
      />
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    cardSlot: {
      flex: 1,
    },
    // Fixed-width remove column, deliberately wider than the set rows' SET_REMOVE_COLUMN_WIDTH:
    // this column sits inside an expanded SplitCard rather than spanning the screen, so it needs
    // the extra width to stay comfortably tappable. The add button reserves the same width
    // (removeColumn) so the two line up.
    removeButton: {
      width: 36,
      alignItems: 'center',
      paddingVertical: spacing.s,
    },
    removeColumn: {
      width: 36,
    },
    emptyHint: {
      paddingVertical: spacing.s,
    },
    // Owns the whole gap from the last workout card — the list's separator only renders
    // between cards, never after the last one.
    addRow: {
      marginTop: spacing.s,
    },
    // Compact overrides on top of layout.addButton — smaller scale for nested day context.
    // flex: 1 so it spans the workout-card column only, not the reserved remove column.
    compactAddButton: {
      flex: 1,
      gap: spacing.xs,
      borderRadius: radius.m,
      paddingVertical: spacing.s,
    },
    addLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
  });
