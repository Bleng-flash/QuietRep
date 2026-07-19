import StatTile from '@/components/home/StatTile';
import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/styles';
import { formatTotalDuration } from '@/utils/datetime';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MonthlyStatsCardProps {
  year: number;
  month: number; // 0-11 (JS Date month index)
  workoutCount: number;
  totalSets: number;
  totalDurationMs: number;
}

// Receives primitive props (not the whole MonthlyStatsEntry) so memo can bail out of re-render for
// unchanged rows even when the parent reloads a fresh array from storage on focus.
const MonthlyStatsCard = memo(function MonthlyStatsCard({
  year,
  month,
  workoutCount,
  totalSets,
  totalDurationMs,
}: MonthlyStatsCardProps) {
  const { layout, typography } = useTheme();
  // month is a 0-11 JS Date index, so new Date(year, month) lands on the correct month.
  const monthLabel = new Date(year, month).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={layout.card}>
      <Text style={[typography.subheading, styles.monthLabel]} numberOfLines={1}>
        {monthLabel}
      </Text>
      <View style={[layout.row, styles.statsRow]}>
        <StatTile value={String(workoutCount)} label="Workouts" />
        <StatTile value={formatTotalDuration(totalDurationMs)} label="Total Time" />
        <StatTile value={String(totalSets)} label="Sets" />
      </View>
    </View>
  );
});

export default MonthlyStatsCard;

const styles = StyleSheet.create({
  monthLabel: {
    marginBottom: spacing.m,
  },
  statsRow: {
    gap: spacing.s,
  },
});
