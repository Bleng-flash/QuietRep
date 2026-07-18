import PastSessionCard from '@/components/history/byWorkout/PastSessionCard';
import ListEmptyText from '@/components/shared/ListEmptyText';
import SectionHeader from '@/components/shared/SectionHeader';
import { spacing } from '@/styles';
import type { WorkoutSession } from '@/types';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { View } from 'react-native';

interface RecentWorkoutsProps {
  sessions: WorkoutSession[];
}

// How many of the newest sessions the Home strip shows; the rest live in the History tab.
const RECENT_LIMIT = 5;

/** Home "Recent workouts" section: the newest few finished sessions as tappable PastSessionCards
 *  (reusing the History card). Sessions arrive newest-first from getSessions(); we show the top few.
 *  A plain map (not a FlatList) — the list is capped at RECENT_LIMIT and lives inside the Home
 *  screen's ScrollView, so virtualization would only fight the outer scroll for no benefit. */
export default function RecentWorkouts({ sessions }: RecentWorkoutsProps) {
  const router = useRouter();

  // Single fixed destination, so navigation lives here rather than as a prop (see over-prop rule).
  // Memoised so the memoised PastSessionCards can bail out of re-render.
  const handleOpenSession = useCallback(
    (sessionId: string) => {
      router.push({ pathname: '/session/[sessionId]', params: { sessionId } });
    },
    [router],
  );

  const recentSessions = useMemo(() => sessions.slice(0, RECENT_LIMIT), [sessions]);

  return (
    <View>
      <SectionHeader title="Recent workouts" />
      {recentSessions.length === 0 ? (
        <ListEmptyText message="No workouts yet. Finish a session to see it here." />
      ) : (
        recentSessions.map((session, index) => {
          const setCount = session.exercises.reduce(
            (runningTotal, exercise) => runningTotal + exercise.sets.length,
            0,
          );
          return (
            <View key={session.id} style={index > 0 ? { marginTop: spacing.s } : undefined}>
              <PastSessionCard
                sessionId={session.id}
                name={session.name}
                startedAt={session.startedAt}
                finishedAt={session.finishedAt}
                exerciseCount={session.exercises.length}
                setCount={setCount}
                onPress={handleOpenSession}
              />
            </View>
          );
        })
      )}
    </View>
  );
}
