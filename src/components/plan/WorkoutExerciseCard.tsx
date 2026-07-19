import PlannedSetRow from '@/components/plan/PlannedSetRow';
import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/styles';
import type { EditablePlannedSet, PlannedSet, ResolvedEditableWorkoutExercise } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { v4 as uuid } from 'uuid';

interface WorkoutExerciseCardProps {
  resolvedWorkoutExercise: ResolvedEditableWorkoutExercise;
  invalidSetKeys: Set<string>; // localKeys of sets to flag red after a failed save
  onSetsChange: (sets: EditablePlannedSet[]) => void;
  onRemove: () => void;
}

/** A card for displaying and editing an exercise within a workout. */
export default function WorkoutExerciseCard({
  resolvedWorkoutExercise,
  invalidSetKeys,
  onSetsChange,
  onRemove,
}: WorkoutExerciseCardProps) {
  const { colors, layout, typography } = useTheme();
  // Destructure for convenient access in handlers and JSX below
  const { exercise, sets } = resolvedWorkoutExercise;

  function handleSetChange(setIndex: number, updated: PlannedSet) {
    // PlannedSetRow emits a plain PlannedSet ({ minReps, maxReps }) — spread currentSet first so the
    // EditablePlannedSet's localKey survives the merge instead of being dropped.
    onSetsChange(
      sets.map((currentSet: EditablePlannedSet, index: number) =>
        index === setIndex ? { ...currentSet, ...updated } : currentSet,
      ),
    );
  }

  // In JavaScript/TypeScript, _ is a convention for a parameter you're required to declare but intentionally don't use
  function handleRemoveSet(setIndex: number) {
    onSetsChange(sets.filter((_: EditablePlannedSet, index: number) => index !== setIndex));
  }

  function handleAddSet() {
    const lastSet = sets[sets.length - 1];
    // Copy the previous set's values but mint a fresh localKey — the new set is a distinct
    // identity, so it must not share a key (and thus a PlannedSetRow instance) with any existing set.
    const newSet: EditablePlannedSet = lastSet
      ? { ...lastSet, localKey: uuid() }
      : { minReps: 0, maxReps: 0, localKey: uuid() };
    onSetsChange([...sets, newSet]);
  }

  return (
    <View style={[layout.card, { marginBottom: spacing.m }]}>
      {/* Header row */}
      <View style={[layout.rowBetween, { marginBottom: spacing.s }]}>
        <View style={{ flex: 1 }}>
          <Text style={typography.subheading} numberOfLines={1}>
            {exercise?.name ?? 'Unknown exercise'}
          </Text>
          {exercise?.muscleGroup ? (
            <Text style={typography.caption}>{exercise.muscleGroup}</Text>
          ) : null}
        </View>

        <View style={[layout.row, { gap: spacing.s }]}>
          <Pressable
            onPress={onRemove}
            hitSlop={8}
            style={({ pressed }) => [pressed && layout.pressedButton]}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </Pressable>
        </View>
      </View>

      <View style={[layout.row, { gap: spacing.s, marginBottom: spacing.xs }]}>
        <View style={{ width: 48 }} />
        <Text style={[typography.caption, { flex: 1, textAlign: 'center' }]}>Rep Range</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* gap separates the set rows so adjacent error-state borders never touch/merge */}
      <View style={{ gap: spacing.xs }}>
        {sets.map((plannedSet, setIndex) => (
          <PlannedSetRow
            // Key by the set's stable localKey (not its array index) so each PlannedSetRow instance
            // stays bound to the same logical set across removals/reorders — this is what
            // prevents PlannedSetRow's local text-buffer state from sticking to the wrong set.
            key={plannedSet.localKey}
            setIndex={setIndex}
            plannedSet={plannedSet}
            isOnly={sets.length === 1}
            hasError={invalidSetKeys.has(plannedSet.localKey)}
            onChange={(updated) => handleSetChange(setIndex, updated)}
            onRemove={() => handleRemoveSet(setIndex)}
          />
        ))}
      </View>

      <Pressable
        onPress={handleAddSet}
        hitSlop={8}
        style={({ pressed }) => [styles.addSetButton, pressed && layout.pressedButton]}
      >
        <Ionicons name="add" size={16} color={colors.primary} />
        <Text style={typography.actionSecondary}>Add set</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginTop: spacing.s,
    paddingVertical: spacing.xs,
  },
});
