import ReadOnlySessionExerciseCard from '@/components/history/ReadOnlySessionExerciseCard';
import ListEmptyText from '@/components/shared/ListEmptyText';
import { getAllExercises, getSessionById } from '@/storage';
import { colors, layout, spacing, typography } from '@/styles';
import type { Exercise, WorkoutSession } from '@/types';
import { formatSessionDate, formatSessionDuration } from '@/utils/session';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SessionDetailProps {
  sessionId: string;
}

/** Read-only detail for one past session: header + summary line + one ReadOnlySessionExerciseCard per
 *  exercise. Resolves each SessionExercise.exerciseId against the catalog (dangling FK tolerated). */
export default function SessionDetail({ sessionId }: SessionDetailProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  // Distinguishes "still loading" from "loaded but not found" so we don't flash a not-found
  // message during the initial async read.
  const [hasLoaded, setHasLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function loadDetail() {
        const [foundSession, exercises] = await Promise.all([
          getSessionById(sessionId),
          getAllExercises(),
        ]);
        setSession(foundSession);
        setAllExercises(exercises);
        setHasLoaded(true);
      }
      loadDetail();
    }, [sessionId]),
  );

  const exerciseMap = useMemo(
    () => new Map(allExercises.map((exercise) => [exercise.id, exercise])),
    [allExercises],
  );

  const resolvedExercises = useMemo(
    () =>
      (session?.exercises ?? []).map((sessionExercise) => ({
        ...sessionExercise,
        exercise: exerciseMap.get(sessionExercise.exerciseId),
      })),
    [session, exerciseMap],
  );

  const totalSets = useMemo(
    () =>
      (session?.exercises ?? []).reduce((runningTotal, exercise) => runningTotal + exercise.sets.length, 0),
    [session],
  );

  return (
    <View style={layout.screen}>
      {/* Back-chevron top bar — same recipe as the exercise library header */}
      <View style={[layout.rowBetween, layout.topBar, { paddingTop: insets.top + spacing.s }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => pressed && layout.pressedButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.dark.textSubtle} />
        </Pressable>
        <Text style={typography.heading} numberOfLines={1}>
          {session?.name ?? ''}
        </Text>
        {/* Placeholder matches back button width to keep title visually centered */}
        <View style={{ width: 24 }} />
      </View>

      {session ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[typography.caption, styles.summaryLine]}>
            {[
              formatSessionDate(session.startedAt),
              formatSessionDuration(session.startedAt, session.finishedAt),
              `${session.exercises.length} exercises`,
              `${totalSets} sets`,
            ]
              .filter(Boolean)
              .join('  •  ')}
          </Text>

          {/* Static read-only list that never reorders — index keys are safe and also handle
              the same exercise appearing twice (mid-session add) without a key collision. */}
          {resolvedExercises.map((resolvedExercise, exerciseIndex) => (
            <ReadOnlySessionExerciseCard
              key={exerciseIndex}
              exercise={resolvedExercise.exercise}
              sets={resolvedExercise.sets}
            />
          ))}
        </ScrollView>
      ) : hasLoaded ? (
        <ListEmptyText message="Workout not found." />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.m,
    paddingBottom: spacing.xxl,
  },
  summaryLine: {
    marginBottom: spacing.m,
  },
});
