import MonthlyStatsCard from '@/components/home/MonthlyStatsCard';
import ListEmptyText from '@/components/shared/ListEmptyText';
import { useTheme } from '@/context/ThemeContext';
import { getMonthlyStatsHistory } from '@/storage';
import { spacing } from '@/styles';
import type { MonthlyStatsEntry } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Monthly-stats history drill-down, reached only from the Home dashboard's "All months" link.
// Kept on the ROOT stack (not tab-local under Home) for symmetry with its twin session/[sessionId]
// (session-detail), which Home also opens via RecentWorkouts and is root-pinned because History
// shares it — so both Home drill-downs hide the tab bar identically. Root also avoids renaming the
// tabs `index` route to make Home a nested stack. A deliberate exception to "one-tab reach ->
// tab-local", the same call as exercise/[exerciseId].
// Read-only: one card per calendar month that has finished sessions, newest-first (current month at
// top) back to the first recorded session's month; gap months are skipped.

// Owns its background via layout.screen.
export default function MonthlyStatsScreen() {
  const { colors, layout, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [monthlyStatsEntries, setMonthlyStatsEntries] = useState<MonthlyStatsEntry[]>([]);
  // Distinguishes "still loading" from "loaded but empty" so we don't flash the empty state
  // during the initial async read.
  const [hasLoaded, setHasLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function loadStats() {
        const monthlyStats = await getMonthlyStatsHistory();
        setMonthlyStatsEntries(monthlyStats);
        setHasLoaded(true);
      }
      loadStats();
    }, []),
  );

  // Spread is exhaustive and type-checked: MonthlyStatsCard's props are exactly MonthlyStatsEntry's
  // fields, and they're all primitives, so memo still bails out for unchanged rows.
  const renderItem = useCallback(
    ({ item }: { item: MonthlyStatsEntry }) => <MonthlyStatsCard {...item} />,
    [],
  );

  return (
    <View style={layout.screen}>
      {/* Back-chevron top bar — same recipe as ExerciseHistory / SessionDetail (no trash action).
          The width-24 spacer keeps the centred title balanced. */}
      <View style={[layout.rowBetween, layout.topBar, { paddingTop: insets.top + spacing.s }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => pressed && layout.pressedButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textSubtle} />
        </Pressable>
        <Text style={typography.heading} numberOfLines={1}>
          Monthly Stats
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={monthlyStatsEntries}
        keyExtractor={(entry) => `${entry.year}-${entry.month}`}
        renderItem={renderItem}
        windowSize={5}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={hasLoaded ? <ListEmptyText message="No workouts logged yet." /> : null}
      />
    </View>
  );
}

function ItemSeparator() {
  return <View style={{ height: spacing.s }} />;
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.m,
    paddingBottom: spacing.xxl,
  },
});
