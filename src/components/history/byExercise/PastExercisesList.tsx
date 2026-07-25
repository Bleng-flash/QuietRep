import PastExerciseCard from '@/components/history/byExercise/PastExerciseCard';
import EmptyState from '@/components/shared/EmptyState';
import { spacing } from '@/styles';
import type { ExerciseHistorySummary } from '@/types';
import { useCallback } from 'react';
import { FlatList, View } from 'react-native';

interface PastExercisesListProps {
  summaries: ExerciseHistorySummary[];
  onOpen: (exerciseId: string) => void;
}

/** The "By exercise" list body: every exercise that appears in session history, most-recently-trained
 *  first, as tappable PastExerciseCards. Summaries arrive pre-joined from storage
 *  (getExerciseHistorySummaries) — no exercise resolution happens here. */
export default function PastExercisesList({ summaries, onOpen }: PastExercisesListProps) {
  const renderItem = useCallback(
    ({ item }: { item: ExerciseHistorySummary }) => (
      <PastExerciseCard
        exerciseId={item.exerciseId}
        name={item.name}
        muscleGroup={item.muscleGroup}
        sessionCount={item.sessionCount}
        lastPerformedAt={item.lastPerformedAt}
        onPress={onOpen}
      />
    ),
    [onOpen],
  );

  return (
    <FlatList
      data={summaries}
      keyExtractor={(summary) => summary.exerciseId}
      renderItem={renderItem}
      windowSize={5}
      ItemSeparatorComponent={() => <View style={{ height: spacing.s }} />}
      ListEmptyComponent={
        <EmptyState
          icon="trending-up-outline"
          title="No exercise history yet"
          message="Finish a workout to track progression per exercise."
        />
      }
      contentContainerStyle={{ padding: spacing.m, paddingBottom: spacing.xxl }}
    />
  );
}
