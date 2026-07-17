import PastExercisesList from '@/components/history/PastExercisesList';
import PastSessionsList from '@/components/history/PastSessionsList';
import SegmentedControl from '@/components/shared/SegmentedControl';
import { getExerciseHistorySummaries, getSessions } from '@/storage';
import { layout, spacing, typography } from '@/styles';
import type { ExerciseHistorySummary, WorkoutSession } from '@/types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The two lenses on history: chronological ("By workout") vs per-exercise progression ("By exercise")
type HistoryLens = 'byWorkout' | 'byExercise';

const LENS_OPTIONS: { key: HistoryLens; label: string }[] = [
  { key: 'byWorkout', label: 'By workout' },
  { key: 'byExercise', label: 'By exercise' },
];

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [lens, setLens] = useState<HistoryLens>('byWorkout');
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [exerciseSummaries, setExerciseSummaries] = useState<ExerciseHistorySummary[]>([]);

  useFocusEffect(
    useCallback(() => {
      async function loadHistory() {
        const [storedSessions, storedSummaries] = await Promise.all([
          getSessions(),
          getExerciseHistorySummaries(),
        ]);
        setSessions(storedSessions);
        setExerciseSummaries(storedSummaries);
      }
      loadHistory();
    }, []),
  );

  // Navigate to the read-only detail for a tapped session. `pathname` is the route *pattern* (the
  // `[sessionId]` file, brackets and all) and not the final URL, and `params` fills that slot — 
  // equivalent to router.push(`/session/${sessionId}`) but param-checked. 
  // push() keeps History on the stack so back returns here. 
  // Memoised (stable ref) so the memoised SessionCards this is threaded down to can bail out of re-render.
  const handleOpenSession = useCallback(
    (sessionId: string) => {
      router.push({ pathname: '/session/[sessionId]', params: { sessionId } });
    },
    [router],
  );

  // Same shape as handleOpenSession, for the "By exercise" lens: opens the per-exercise
  // progression detail. Memoised so the memoised ExerciseHistoryCards can bail out of re-render.
  const handleOpenExercise = useCallback(
    (exerciseId: string) => {
      router.push({ pathname: '/exercise/[exerciseId]', params: { exerciseId } });
    },
    [router],
  );

  return (
    <View style={layout.screen}>
      {/* Pinned header — title + segmented control stay put while the list below scrolls */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.s }]}>
        <Text style={[typography.heading, styles.title]}>History</Text>
        <SegmentedControl options={LENS_OPTIONS} value={lens} onChange={setLens} />
      </View>

      <View style={{ flex: 1 }}>
        {lens === 'byWorkout' ? (
          <PastSessionsList sessions={sessions} onOpen={handleOpenSession} />
        ) : (
          <PastExercisesList summaries={exerciseSummaries} onOpen={handleOpenExercise} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.s,
    gap: spacing.s,
  },
  title: {
    marginBottom: spacing.xs,
  },
});
