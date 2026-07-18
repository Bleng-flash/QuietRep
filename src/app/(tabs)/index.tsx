import MonthlyStatsCard from '@/components/home/MonthlyStatsCard';
import RecentWorkouts from '@/components/home/RecentWorkouts';
import { getCurrentMonthSummary, getSessions } from '@/storage';
import { colors, layout, spacing, typography } from '@/styles';
import type { MonthlyStatsEntry, WorkoutSession } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Zeroed current-month stats for the first paint before the async load resolves, so the dashboard
// renders real (empty) numbers rather than needing a null guard. Tagged with the actual current
// month, matching what getCurrentMonthSummary() returns for a month with no sessions.
const now = new Date();
const EMPTY_MONTH: MonthlyStatsEntry = {
  year: now.getFullYear(),
  month: now.getMonth(),
  workoutCount: 0,
  totalSets: 0,
  totalDurationMs: 0,
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [currentMonth, setCurrentMonth] = useState<MonthlyStatsEntry>(EMPTY_MONTH);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  // Two storage reads mirroring two future endpoints (monthly-summary + all sessions). Both read the
  // same AsyncStorage key today — negligible cost, and it keeps the backend transition clean.
  useFocusEffect(
    useCallback(() => {
      async function loadHome() {
        const [monthSummary, storedSessions] = await Promise.all([
          getCurrentMonthSummary(),
          getSessions(),
        ]);
        setCurrentMonth(monthSummary);
        setSessions(storedSessions);
      }
      loadHome();
    }, []),
  );

  return (
    <ScrollView
      style={layout.screen}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.s,
        paddingHorizontal: spacing.m,
        paddingBottom: spacing.xxl,
      }}
    >
      <View style={[layout.rowBetween, styles.sectionHeader]}>
        <Text style={typography.heading}>This month</Text>
        <Pressable
          onPress={() => router.push('/monthly-stats')}
          hitSlop={8}
          style={({ pressed }) => [layout.row, styles.allMonthsLink, pressed && layout.pressedButton]}
        >
          <Text style={typography.actionSubtle}>All months</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.dark.textSubtle} />
        </Pressable>
      </View>

      <MonthlyStatsCard {...currentMonth} />

      <RecentWorkouts sessions={sessions} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginBottom: spacing.s,
  },
  allMonthsLink: {
    gap: spacing.xs,
  },
});
