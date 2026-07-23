import BodyweightChart, { type BodyweightChartPoint } from '@/components/profile/BodyweightChart';
import ListEmptyText from '@/components/shared/ListEmptyText';
import SegmentedControl from '@/components/shared/SegmentedControl';
import { useTheme } from '@/context/ThemeContext';
import { useUnit } from '@/context/UnitContext';
import { getBodyweightEntries } from '@/storage';
import { spacing } from '@/styles';
import type { BodyweightEntry } from '@/types';
import { convertWeight } from '@/utils/units';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The chart's selectable time window.
type BodyweightRange = 'all' | '1m' | '3m' | '1y';

const RANGE_OPTIONS: { key: BodyweightRange; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: '1m', label: '1M' },
  { key: '3m', label: '3M' },
  { key: '1y', label: '1Y' },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Fixed-length windows (1M = 30 days, 3M = 90, 1Y = 365), chosen instead of calendar-month subtraction so
// a given range always spans exactly the same horizontal extent — and so the "Mar 31 minus 1 month"
// class of Date rollover bugs cannot exist (pure epoch-ms arithmetic, no Date mutation). Accepted
// imprecision, deliberate: "1M" is 30 days rather than a calendar month (±2 days), and "1Y" is one
// day short across a leap Feb 29. (DST wall-clock shift does not apply — no DST in SG, and this is
// only a chart filter bound.)
const RANGE_DAYS: Record<Exclude<BodyweightRange, 'all'>, number> = {
  '1m': 30,
  '3m': 90,
  '1y': 365,
};

// Bodyweight trend screen — a root-stack screen reached from the Profile tab (opens full-screen with
// the tab bar hidden, the monthly-stats / session-detail recipe). Owns its background via layout.screen.
// Chart-first: this screen is only the progression graph + range selector. Logging happens on the
// Home tab (LogBodyweightCard); the full entry list with delete lives one tap away behind the
// top bar's list icon (/bodyweight/entries). Returning from there refreshes the chart via
// useFocusEffect, so a deletion is reflected with no extra plumbing.
export default function BodyweightScreen() {
  const { colors, layout, typography } = useTheme();
  const { unit } = useUnit();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [bodyweightEntries, setBodyweightEntries] = useState<BodyweightEntry[]>([]);
  // Distinguishes "still loading" from "loaded but empty" so the empty state never flashes.
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selectedRange, setSelectedRange] = useState<BodyweightRange>('all');

  useFocusEffect(
    useCallback(() => {
      async function loadEntries() {
        const stored = await getBodyweightEntries();
        setBodyweightEntries(stored);
        setHasLoaded(true);
      }
      loadEntries();
    }, []),
  );

  // Points for the chart: filtered to the selected window, converted to the current display unit,
  // sorted oldest -> newest. 
  // Windowed ranges pin domainEnd to "now" (since a "past month" is defined relative to today); 
  // "All" spans exactly the logged data [first, last] so the trend does not drift left behind a growing empty tail.
  const chartData = useMemo(() => {
    const now = Date.now();
    const startMs = rangeStartMs(selectedRange, now);
    const inRange =
      startMs === null
        ? bodyweightEntries
        : bodyweightEntries.filter((entry) => new Date(entry.recordedAt).getTime() >= startMs);
    const points: BodyweightChartPoint[] = inRange
      .map((entry) => ({
        recordedAt: entry.recordedAt,
        weight: convertWeight(entry.weight, entry.unit, unit),
      }))
      .sort((first, second) => first.recordedAt.localeCompare(second.recordedAt));
    const domainStartMs =
      startMs ?? (points.length > 0 ? new Date(points[0].recordedAt).getTime() : now);
    const domainEndMs =
      startMs === null && points.length > 0
        ? new Date(points[points.length - 1].recordedAt).getTime()
        : now;
    return { points, domainStartMs, domainEndMs };
  }, [bodyweightEntries, selectedRange, unit]);

  return (
    <View style={layout.screen}>
      {/* Back-chevron top bar; the right slot is the list icon opening the entries screen
          (the SessionDetail right-slot recipe), which balances the centred title. */}
      <View style={[layout.rowBetween, layout.topBar, { paddingTop: insets.top + spacing.s }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => pressed && layout.pressedButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textSubtle} />
        </Pressable>
        <Text style={typography.heading} numberOfLines={1}>
          Bodyweight
        </Text>
        <Pressable
          onPress={() => router.push('/bodyweight/entries')}
          hitSlop={8}
          style={({ pressed }) => pressed && layout.pressedButton}
        >
          <Ionicons name="list-outline" size={24} color={colors.textSubtle} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {hasLoaded &&
          (bodyweightEntries.length === 0 ? (
            <ListEmptyText message="No bodyweight entries yet." />
          ) : (
            <>
              <SegmentedControl
                options={RANGE_OPTIONS}
                value={selectedRange}
                onChange={setSelectedRange}
              />
              {chartData.points.length >= 2 ? (
                <BodyweightChart
                  points={chartData.points}
                  unit={unit}
                  domainStartMs={chartData.domainStartMs}
                  domainEndMs={chartData.domainEndMs}
                />
              ) : (
                <Text style={[typography.caption, styles.chartPlaceholder]}>
                  {chartData.points.length === 1
                    ? 'Log more entries to see a trend.'
                    : `No readings in the ${rangeLabel(selectedRange)}.`}
                </Text>
              )}
            </>
          ))}
      </ScrollView>
    </View>
  );
}

// Start of the selected window in epoch ms, or null for "All" (no lower bound).
function rangeStartMs(range: BodyweightRange, now: number): number | null {
  if (range === 'all') return null;
  return now - RANGE_DAYS[range] * MS_PER_DAY;
}

// Human phrase for the empty-window caption, matching the fixed window lengths. "all" is never
// passed here — an "All" view with any entries always has at least one point.
function rangeLabel(range: BodyweightRange): string {
  if (range === '1m') return 'past 30 days';
  if (range === '3m') return 'past 90 days';
  return 'past year';
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.m,
    paddingBottom: spacing.xxl,
    gap: spacing.m,
  },
  chartPlaceholder: {
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
