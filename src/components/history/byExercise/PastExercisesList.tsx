import PastExerciseCard from '@/components/history/byExercise/PastExerciseCard';
import ListEmptyText from '@/components/shared/ListEmptyText';
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
        <ListEmptyText message="No exercise history yet. Finish a session to see progression here." />
      }
      contentContainerStyle={{ padding: spacing.m, paddingBottom: spacing.xxl }}
    />
  );
}
