import { useTheme } from '@/context/ThemeContext';
import { useUnit } from '@/context/UnitContext';
import { spacing } from '@/styles';
import type { LoggedSet, WeightUnit } from '@/types';
import { formatSessionDate } from '@/utils/datetime';
import { formatWeight } from '@/utils/units';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ExercisePerformanceCardProps {
  sessionName: string;
  performedAt: string; // ISO 8601 — the session's startedAt
  // The unit these sets were logged in, from the parent session. Converted for display below,
  // which is what makes a kg-logged and an lbs-logged session comparable down the list.
  loggedUnit: WeightUnit;
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
  loggedUnit,
  sets,
}: ExercisePerformanceCardProps) {
  const { layout, typography } = useTheme();
  // Own useUnit() call — like useTheme() above, a context change re-renders past memo, which is
  // what repaints this row on a unit toggle. Threading it as a prop would defeat the memo.
  const { unit: displayUnit } = useUnit();
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

      {/* Column headers — widths mirror the set rows below. The header carries the unit, so the
          rows render a bare number rather than repeating it on every line. */}
      <View style={[layout.row, { gap: spacing.s, marginBottom: spacing.xs }]}>
        <View style={{ width: 48 }} />
        <Text style={[typography.caption, styles.columnHeader]}>Load ({displayUnit})</Text>
        <Text style={[typography.caption, styles.columnHeader]}>Reps</Text>
      </View>

      {/* Static read-only rows that never reorder — index keys are safe */}
      {sets.map((loggedSet, setIndex) => (
        <View key={setIndex} style={[layout.row, styles.setRow]}>
          <Text style={[typography.caption, { width: 48 }]}>Set {setIndex + 1}</Text>
          <Text style={[typography.body, styles.setValue]}>
            {formatWeight(loggedSet.weight, loggedUnit, displayUnit)}
          </Text>
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
