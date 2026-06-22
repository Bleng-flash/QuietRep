import SetRow from '@/components/shared/SetRow';
import { colors, layout, spacing, typography } from '@/styles';
import type { EditableSet, ResolvedEditableWorkoutExercise, SetScheme } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { v4 as uuid } from 'uuid';

interface WorkoutExerciseCardProps {
  resolvedWorkoutExercise: ResolvedEditableWorkoutExercise;
  isFirst: boolean;
  isLast: boolean;
  onSetsChange: (sets: EditableSet[]) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

/** A card for displaying and editing an exercise within a workout. */
export default function WorkoutExerciseCard({
  resolvedWorkoutExercise,
  isFirst,
  isLast,
  onSetsChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: WorkoutExerciseCardProps) {
  // Destructure for convenient access in handlers and JSX below
  const { exercise, sets } = resolvedWorkoutExercise;

  function handleSetChange(setIndex: number, updated: SetScheme) {
    // SetRow emits a plain SetScheme ({ minReps, maxReps }) — spread currentSet first so the
    // EditableSet's localKey survives the merge instead of being dropped.
    onSetsChange(
      sets.map((currentSet: EditableSet, index: number) =>
        index === setIndex ? { ...currentSet, ...updated } : currentSet,
      ),
    );
  }

  // In JavaScript/TypeScript, _ is a convention for a parameter you're required to declare but intentionally don't use
  function handleRemoveSet(setIndex: number) {
    onSetsChange(sets.filter((_: EditableSet, index: number) => index !== setIndex));
  }

  function handleAddSet() {
    const lastSet = sets[sets.length - 1];
    // Copy the previous set's values but mint a fresh localKey — the new set is a distinct
    // identity, so it must not share a key (and thus a SetRow instance) with any existing set.
    const newSet: EditableSet = lastSet
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

      <View style={[layout.row, { gap: spacing.s, marginBottom: spacing.xs }]}>
        <View style={{ width: 48 }} />
        <Text style={[typography.caption, { flex: 1, textAlign: 'center' }]}>Rep Range</Text>
        <View style={{ width: 32 }} />
      </View>

      {sets.map((setScheme, setIndex) => (
        <SetRow
          // Key by the set's stable localKey (not its array index) so each SetRow instance
          // stays bound to the same logical set across removals/reorders — this is what
          // prevents SetRow's local text-buffer state from sticking to the wrong set.
          key={setScheme.localKey}
          setIndex={setIndex}
          setScheme={setScheme}
          isOnly={sets.length === 1}
          onChange={(updated) => handleSetChange(setIndex, updated)}
          onRemove={() => handleRemoveSet(setIndex)}
        />
      ))}

      <Pressable
        onPress={handleAddSet}
        hitSlop={8}
        style={({ pressed }) => [styles.addSetButton, pressed && layout.pressedButton]}
      >
        <Ionicons name="add" size={16} color={colors.dark.primary} />
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
