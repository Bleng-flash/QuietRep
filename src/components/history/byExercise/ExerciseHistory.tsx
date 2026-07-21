import ExercisePerformanceCard from '@/components/history/byExercise/ExercisePerformanceCard';
import ListEmptyText from '@/components/shared/ListEmptyText';
import { useTheme } from '@/context/ThemeContext';
import { getExerciseById, getExercisePerformances } from '@/storage';
import { spacing } from '@/styles';
import type { Exercise, ExercisePerformance } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ExerciseHistoryProps {
  exerciseId: string;
}

/** Read-only progression view for one exercise: every past session in which it was performed,
 *  newest first, one ExercisePerformanceCard (date + logged sets) per session.
 *  The exercise name resolves against the catalog; a dangling FK (exercise deleted after being
 *  logged) still shows its history under "Unknown exercise". */
export default function ExerciseHistory({ exerciseId }: ExerciseHistoryProps) {
  const { colors, layout, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [performances, setPerformances] = useState<ExercisePerformance[]>([]);
  // Distinguishes "still loading" from "loaded but empty/unknown" so we don't flash the
  // empty-state message (or "Unknown exercise") during the initial async read.
  const [hasLoaded, setHasLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function loadHistory() {
        const [loadedPerformances, foundExercise] = await Promise.all([
          getExercisePerformances(exerciseId),
          getExerciseById(exerciseId),
        ]);
        setPerformances(loadedPerformances);
        setExercise(foundExercise);
        setHasLoaded(true);
      }
      loadHistory();
    }, [exerciseId]),
  );

  const renderItem = useCallback(
    ({ item }: { item: ExercisePerformance }) => (
      <ExercisePerformanceCard
        sessionName={item.sessionName}
        performedAt={item.performedAt}
        loggedUnit={item.unit}
        sets={item.sets}
      />
    ),
    [],
  );

  return (
    <View style={layout.screen}>
      {/* Back-chevron top bar — same recipe as SessionDetail, minus the trash action
          (nothing to delete here). The width-24 spacer keeps the centred title balanced. */}
      <View style={[layout.rowBetween, layout.topBar, { paddingTop: insets.top + spacing.s }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => pressed && layout.pressedButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textSubtle} />
        </Pressable>
        <Text style={typography.heading} numberOfLines={1}>
          {exercise?.name ?? (hasLoaded ? 'Unknown exercise' : '')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={performances}
        keyExtractor={(performance) => performance.sessionId}
        renderItem={renderItem}
        windowSize={5}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ItemSeparator}
        ListHeaderComponent={
          performances.length > 0 ? (
            <Text style={[typography.caption, styles.summaryLine]}>
              {[
                exercise?.muscleGroup,
                `${performances.length} session${performances.length === 1 ? '' : 's'}`,
              ]
                .filter(Boolean)
                .join('  •  ')}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          hasLoaded ? <ListEmptyText message="No sets logged for this exercise yet." /> : null
        }
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
  summaryLine: {
    marginBottom: spacing.m,
  },
});
