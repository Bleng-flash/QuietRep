import { layout, spacing, typography } from '@/styles';
import type { Exercise, LoggedSet } from '@/types';
import { StyleSheet, Text, View } from 'react-native';

interface ReadOnlySessionExerciseCardProps {
  // undefined when the exercise was deleted from the catalog after this session was logged
  // (dangling FK) — falls back to "Unknown exercise", mirroring SessionExerciseCard.
  exercise: Exercise | undefined;
  sets: LoggedSet[];
}

/** Read-only counterpart to SessionExerciseCard: renders a past session's logged sets as plain
 *  text (no TextInputs, no add/remove). Reuses the layout.card shell and column layout. */
export default function ReadOnlySessionExerciseCard({ exercise, sets }: ReadOnlySessionExerciseCardProps) {
  return (
    <View style={[layout.card, { marginBottom: spacing.m }]}>
      {/* Header */}
      <View style={{ marginBottom: spacing.s }}>
        <Text style={typography.subheading} numberOfLines={1}>
          {exercise?.name ?? 'Unknown exercise'}
        </Text>
        {exercise?.muscleGroup ? (
          <Text style={typography.caption}>{exercise.muscleGroup}</Text>
        ) : null}
      </View>

      {/* Column headers — widths mirror the set rows below (Load (kg) hardcoded, units deferred) */}
      <View style={[layout.row, { gap: spacing.s, marginBottom: spacing.xs }]}>
        <View style={{ width: 48 }} />
        <Text style={[typography.caption, styles.columnHeader]}>Load (kg)</Text>
        <Text style={[typography.caption, styles.columnHeader]}>Reps</Text>
      </View>

      {sets.map((loggedSet, setIndex) => (
        <View key={setIndex} style={[layout.row, styles.setRow]}>
          <Text style={[typography.caption, { width: 48 }]}>Set {setIndex + 1}</Text>
          <Text style={[typography.body, styles.setValue]}>{loggedSet.weight}</Text>
          <Text style={[typography.body, styles.setValue]}>{loggedSet.reps}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  columnHeader: {
    flex: 1,
    textAlign: 'center',
  },
  setRow: {
    gap: spacing.s,
    paddingVertical: spacing.xs,
  },
  setValue: {
    flex: 1,
    textAlign: 'center',
  },
});
