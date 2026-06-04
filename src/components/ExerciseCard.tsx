import SetRow from '@/components/SetRow';
import { colors, layout, spacing, typography } from '@/styles';
import type { Exercise, SetScheme, WorkoutExercise } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface ExerciseCardProps {
  workoutExercise: WorkoutExercise;
  exercise: Exercise | undefined;
  isFirst: boolean;
  isLast: boolean;
  onSetsChange: (sets: SetScheme[]) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export default function ExerciseCard({
  workoutExercise,
  exercise,
  isFirst,
  isLast,
  onSetsChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: ExerciseCardProps) {
  function handleSetChange(setIndex: number, updated: SetScheme) {
    onSetsChange(
      workoutExercise.sets.map((currentSet, index) => (index === setIndex ? updated : currentSet)),
    );
  }

  // In JavaScript/TypeScript, _ is a convention for a parameter you're required to declare but intentionally don't use
  function handleRemoveSet(setIndex: number) {
    onSetsChange(workoutExercise.sets.filter((_, index) => index !== setIndex));
  }

  function handleAddSet() {
    const lastSet = workoutExercise.sets[workoutExercise.sets.length - 1];
    const newSet: SetScheme = lastSet ? { ...lastSet } : { reps: 0, load: 0 };
    onSetsChange([...workoutExercise.sets, newSet]);
  }

  return (
    <View style={styles.card}>
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
            onPress={onMoveUp}
            disabled={isFirst}
            hitSlop={8}
            style={({ pressed }) => [{ opacity: isFirst ? 0.25 : pressed ? 0.5 : 1 }]}
          >
            <Ionicons name="chevron-up" size={20} color={colors.dark.textSubtle} />
          </Pressable>
          <Pressable
            onPress={onMoveDown}
            disabled={isLast}
            hitSlop={8}
            style={({ pressed }) => [{ opacity: isLast ? 0.25 : pressed ? 0.5 : 1 }]}
          >
            <Ionicons name="chevron-down" size={20} color={colors.dark.textSubtle} />
          </Pressable>
          <Pressable
            onPress={onRemove}
            hitSlop={8}
            style={({ pressed }) => [pressed && { opacity: 0.5 }]}
          >
            <Ionicons name="trash-outline" size={20} color={colors.dark.error} />
          </Pressable>
        </View>
      </View>

      {/* Column labels */}
      <View style={[layout.row, { gap: spacing.s, marginBottom: spacing.xs }]}>
        <View style={{ width: 44 }} />
        <Text style={[typography.caption, { flex: 1, textAlign: 'center' }]}>Reps</Text>
        <Text style={[typography.caption, { flex: 1, textAlign: 'center' }]}>Load (kg)</Text>
        <View style={{ width: 36 }} />
      </View>

      {workoutExercise.sets.map((scheme, setIndex) => (
        <SetRow
          key={setIndex}
          setIndex={setIndex}
          setScheme={scheme}
          isOnly={workoutExercise.sets.length === 1}
          onChange={(updated) => handleSetChange(setIndex, updated)}
          onRemove={() => handleRemoveSet(setIndex)}
        />
      ))}

      <Pressable
        onPress={handleAddSet}
        hitSlop={8}
        style={({ pressed }) => [styles.addSetButton, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="add" size={16} color={colors.dark.primary} />
        <Text style={styles.addSetLabel}>Add set</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginTop: spacing.s,
    paddingVertical: spacing.xs,
  },
  addSetLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.dark.primary,
  },
});
