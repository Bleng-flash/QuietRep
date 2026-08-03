import { useTheme } from '@/context/ThemeContext';
import { useUnit } from '@/context/UnitContext';
import { SET_LABEL_COLUMN_WIDTH, spacing } from '@/styles';
import type { Exercise, LoggedSet, WeightUnit } from '@/types';
import { formatWeight } from '@/utils/units';
import { StyleSheet, Text, View } from 'react-native';

interface ReadOnlySessionExerciseCardProps {
  // undefined when the exercise was deleted from the catalog after this session was logged
  // (dangling FK) — falls back to "Unknown exercise", mirroring SessionExerciseCard.
  exercise: Exercise | undefined;
  // The unit these sets were logged in, from the parent session. Converted for display below.
  loggedUnit: WeightUnit;
  sets: LoggedSet[];
}

/** Read-only counterpart to SessionExerciseCard: renders a past session's logged sets as plain
 *  text (no TextInputs, no add/remove). Reuses the layout.card shell and column layout.
 *
 *  Converts inside the card rather than taking pre-formatted strings, mirroring the theming rule:
 *  a component that renders a settings-driven value subscribes to that setting itself. */
export default function ReadOnlySessionExerciseCard({
  exercise,
  loggedUnit,
  sets,
}: ReadOnlySessionExerciseCardProps) {
  const { layout, typography } = useTheme();
  // The unit the viewer is reading in right now — different from loggedUnit.
  const { unit: displayUnit } = useUnit();
  // This card owns its own bottom gap, unlike the list-rendered cards where the list's separator
  // is the single source. Its one consumer (SessionDetail) maps it directly with no separator
  // mechanism, so there is nothing here to conflict with.
  return (
    <View style={[layout.card, { marginBottom: spacing.s }]}>
      {/* Header */}
      <View style={{ marginBottom: spacing.s }}>
        <Text style={typography.subheading} numberOfLines={1}>
          {exercise?.name ?? 'Unknown exercise'}
        </Text>
        {exercise?.muscleGroup ? (
          <Text style={typography.caption}>{exercise.muscleGroup}</Text>
        ) : null}
      </View>

      {/* Column headers — widths mirror the set rows below. The header carries the unit, so the
          rows render a bare number rather than repeating it on every line. */}
      <View style={[layout.row, { gap: spacing.s, marginBottom: spacing.xs }]}>
        <View style={{ width: SET_LABEL_COLUMN_WIDTH }} />
        <Text style={[typography.caption, styles.columnHeader]}>Load ({displayUnit})</Text>
        <Text style={[typography.caption, styles.columnHeader]}>Reps</Text>
      </View>

      {sets.map((loggedSet, setIndex) => (
        <View key={setIndex} style={[layout.row, styles.setRow]}>
          <Text style={[typography.caption, { width: SET_LABEL_COLUMN_WIDTH }]}>
            Set {setIndex + 1}
          </Text>
          <Text style={[typography.body, styles.setValue]}>
            {formatWeight(loggedSet.weight, loggedUnit, displayUnit)}
          </Text>
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
