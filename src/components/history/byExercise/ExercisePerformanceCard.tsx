import { layout, spacing, typography } from '@/styles';
import type { LoggedSet } from '@/types';
import { formatSessionDate } from '@/utils/session';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ExercisePerformanceCardProps {
  sessionName: string;
  performedAt: string; // ISO 8601 — the session's startedAt
  sets: LoggedSet[];
}

/** One past session's logged sets for a single exercise, on the exercise-history detail screen.
 *  The date leads the header — the progression lens answers "what did I lift on that day?" — with
 *  the session name as context below. Column layout mirrors ReadOnlySessionExerciseCard.
 *  Memoised for the detail's FlatList; sets is a fresh array reference after each focus reload,
 *  so the bailout covers re-renders between loads, not across them. */
function ExercisePerformanceCard({
  sessionName,
  performedAt,
  sets,
}: ExercisePerformanceCardProps) {
  return (
    <View style={layout.card}>
      {/* Header */}
      <View style={{ marginBottom: spacing.s }}>
        <Text style={typography.subheading} numberOfLines={1}>
          {formatSessionDate(performedAt)}
        </Text>
        <Text style={typography.caption} numberOfLines={1}>
          {sessionName}
        </Text>
      </View>

      {/* Column headers — widths mirror the set rows below (Load (kg) hardcoded, units deferred) */}
      <View style={[layout.row, { gap: spacing.s, marginBottom: spacing.xs }]}>
        <View style={{ width: 48 }} />
        <Text style={[typography.caption, styles.columnHeader]}>Load (kg)</Text>
        <Text style={[typography.caption, styles.columnHeader]}>Reps</Text>
      </View>

      {/* Static read-only rows that never reorder — index keys are safe */}
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

export default memo(ExercisePerformanceCard);

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
