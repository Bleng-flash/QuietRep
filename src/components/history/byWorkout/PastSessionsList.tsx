import PastSessionCard from '@/components/history/byWorkout/PastSessionCard';
import EmptyState from '@/components/shared/EmptyState';
import { spacing } from '@/styles';
import type { WorkoutSession } from '@/types';
import { useCallback } from 'react';
import { FlatList, View } from 'react-native';

interface PastSessionsListProps {
  sessions: WorkoutSession[];
  onOpen: (sessionId: string) => void;
}

/** The "By workout" list body: finished sessions newest-first as tappable PastSessionCards.
 *  Exercise/set counts are derived here from the canonical session (no exercise resolution needed
 *  for the list — only the detail view resolves names). */
export default function PastSessionsList({ sessions, onOpen }: PastSessionsListProps) {
  const renderItem = useCallback(
    ({ item }: { item: WorkoutSession }) => {
      const setCount = item.exercises.reduce(
        (runningTotal, exercise) => runningTotal + exercise.sets.length,
        0,
      );
      return (
        <PastSessionCard
          sessionId={item.id}
          name={item.name}
          startedAt={item.startedAt}
          finishedAt={item.finishedAt}
          exerciseCount={item.exercises.length}
          setCount={setCount}
          onPress={onOpen}
        />
      );
    },
    [onOpen],
  );

  return (
    <FlatList
      data={sessions}
      keyExtractor={(session) => session.id}
      renderItem={renderItem}
      windowSize={5}
      ItemSeparatorComponent={() => <View style={{ height: spacing.s }} />}
      ListEmptyComponent={
        <EmptyState
          icon="barbell-outline"
          title="No workouts logged yet"
          message="Finish a workout to see it here."
        />
      }
      contentContainerStyle={{ padding: spacing.m, paddingBottom: spacing.xxl }}
    />
  );
}
