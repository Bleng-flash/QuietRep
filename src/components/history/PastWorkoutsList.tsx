import SessionCard from '@/components/history/SessionCard';
import ListEmptyText from '@/components/shared/ListEmptyText';
import { spacing } from '@/styles';
import type { WorkoutSession } from '@/types';
import { useCallback } from 'react';
import { FlatList, View } from 'react-native';

interface PastWorkoutsListProps {
  sessions: WorkoutSession[];
  onOpen: (sessionId: string) => void;
}

/** The "By workout" list body: finished sessions newest-first as tappable SessionCards.
 *  Exercise/set counts are derived here from the canonical session (no exercise resolution needed
 *  for the list — only the detail view resolves names). */
export default function PastWorkoutsList({ sessions, onOpen }: PastWorkoutsListProps) {
  const renderItem = useCallback(
    ({ item }: { item: WorkoutSession }) => {
      const setCount = item.exercises.reduce(
        (runningTotal, exercise) => runningTotal + exercise.sets.length,
        0,
      );
      return (
        <SessionCard
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
        <ListEmptyText message="No workouts yet. Finish a session to see it here." />
      }
      contentContainerStyle={{ padding: spacing.m, paddingBottom: spacing.xxl }}
    />
  );
}
