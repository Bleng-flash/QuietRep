import LoggedSetRow from '@/components/session/LoggedSetRow';
import { colors, layout, spacing, typography } from '@/styles';
import type { EditableLoggedSet, LoggedSet, ResolvedEditableSessionExercise } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { v4 as uuid } from 'uuid';

interface SessionExerciseCardProps {
  resolvedSessionExercise: ResolvedEditableSessionExercise;
  invalidSetKeys: Set<string>; // localKeys of sets to flag red after a failed finish
  onSetsChange: (sets: EditableLoggedSet[]) => void;
  onRemove: () => void;
}

export default function SessionExerciseCard({
  resolvedSessionExercise,
  invalidSetKeys,
  onSetsChange,
  onRemove,
}: SessionExerciseCardProps) {
  const { exercise, sets } = resolvedSessionExercise;

  function handleSetChange(setIndex: number, updated: LoggedSet) {
    // LoggedSetRow emits a plain LoggedSet ({ weight, reps }) — spread currentSet first so
    // EditableLoggedSet's localKey and target hints survive the merge.
    onSetsChange(
      sets.map((currentSet: EditableLoggedSet, index: number) =>
        index === setIndex ? { ...currentSet, ...updated } : currentSet,
      ),
    );
  }

  function handleRemoveSet(setIndex: number) {
    onSetsChange(sets.filter((_: EditableLoggedSet, index: number) => index !== setIndex));
  }

  function handleAddSet() {
    // Start each new set blank — loads and reps commonly change set to set in a live session.
    // A blank set (reps 0) also stays invalid until logged, so it can't be Finished unperformed.
    const newSet: EditableLoggedSet = { weight: 0, reps: 0, localKey: uuid() };
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

        <Pressable
          onPress={onRemove}
          hitSlop={8}
          style={({ pressed }) => [pressed && layout.pressedButton]}
        >
          <Ionicons name="trash-outline" size={20} color={colors.dark.error} />
        </Pressable>
      </View>

      {/* Column headers — widths mirror LoggedSetRow layout */}
      <View style={[layout.row, { gap: spacing.s, marginBottom: spacing.xs }]}>
        <View style={{ width: 48 }} />
        <Text style={[typography.caption, styles.columnHeader]}>Load (kg)</Text>
        <Text style={[typography.caption, styles.columnHeader]}>Reps</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* gap separates the set rows so adjacent error-state borders never touch/merge */}
      <View style={{ gap: spacing.xs }}>
        {sets.map((editableLoggedSet, setIndex) => (
          <LoggedSetRow
            // Key by localKey (not index) so each row stays bound to the same logical set
            // across additions and removals — prevents stale text-buffer state.
            key={editableLoggedSet.localKey}
            setIndex={setIndex}
            editableLoggedSet={editableLoggedSet}
            isOnly={sets.length === 1}
            hasError={invalidSetKeys.has(editableLoggedSet.localKey)}
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
        <Ionicons name="add" size={16} color={colors.dark.primary} />
        <Text style={typography.actionSecondary}>Add set</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  columnHeader: {
    flex: 1,
    textAlign: 'center',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginTop: spacing.s,
    paddingVertical: spacing.xs,
  },
});
