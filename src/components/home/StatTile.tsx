import { colors, spacing, typography } from '@/styles';
import { StyleSheet, Text, View } from 'react-native';

interface StatTileProps {
  value: string;
  label: string;
}

/** One stat cell: a prominent value over a caption label. Layout-neutral (flex: 1, centred) so it
 *  composes into a row of three — inside a MonthlyStatsCard, or across the Home dashboard.
 *  adjustsFontSizeToFit lets a long value (e.g. "12h 30m") shrink to fit its column rather than
 *  truncate with an ellipsis. */
export default function StatTile({ value, label }: StatTileProps) {
  return (
    <View style={styles.tile}>
      <Text style={[typography.heading, styles.value]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[typography.caption, styles.label]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    color: colors.dark.primary,
  },
  label: {
    textAlign: 'center',
  },
});
