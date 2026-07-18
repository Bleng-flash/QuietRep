import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScrollViewContainer } from 'react-native-reorderable-list';

import NamePromptModal from '@/components/shared/NamePromptModal';
import SectionHeader from '@/components/shared/SectionHeader';
import SplitCard from '@/components/plan/SplitCard';
import WorkoutCard from '@/components/shared/WorkoutCard';
import { addSplit, getActiveSplitId, getAllExercises, getSplits, getWorkouts } from '@/storage';
import { colors, layout, spacing, typography } from '@/styles';
import type { Exercise, Split, Workout } from '@/types';
import { createEmptyDays } from '@/utils/split';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [splits, setSplits] = useState<Split[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [activeSplitId, setActiveSplitId] = useState<string | null>(null);
  const [isNewSplitOpen, setIsNewSplitOpen] = useState(false);
  // Only standalone workouts are shown in the Workouts section.
  const standaloneWorkouts = workouts.filter((workout) => workout.isStandalone);

  // Defined at component level (not inline in useFocusEffect) so SplitCards can call it as their
  // onChanged refresh after inline mutations that don't navigate away.
  const load = useCallback(async () => {
    const [splits, workouts, exercises, activeSplitId] = await Promise.all([
      getSplits(),
      getWorkouts(),
      getAllExercises(),
      getActiveSplitId(),
    ]);
    setSplits(splits);
    setWorkouts(workouts);
    setExercises(exercises);
    setActiveSplitId(activeSplitId);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleCreateSplit(name: string) {
    setIsNewSplitOpen(false);
    await addSplit({ name, days: createEmptyDays() });
    await load();
  }

  return (
    <ScrollViewContainer
      style={layout.screen}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.s }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Splits ── */}
      {/* flushTop: leads the screen, so drop the default top margin to align with Home/History */}
      <SectionHeader
        title="Splits"
        onButtonPress={() => setIsNewSplitOpen(true)}
        buttonLabel="New Split"
        flushTop
      />

      {splits.length === 0 ? (
        <EmptyState message="No splits yet. Create one to get started." />
      ) : (
        <FlatList
          data={splits}
          keyExtractor={(item) => item.id}
          // disable FlatList's own scroll container so the outer ScrollView
          // (which wraps the whole screen) handles scrolling instead
          scrollEnabled={false}
          renderItem={({ item }) => (
            <SplitCard
              split={item}
              isActive={item.id === activeSplitId}
              allWorkouts={workouts}
              standaloneWorkouts={standaloneWorkouts}
              allExercises={exercises}
              onChanged={load}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.s }} />}
        />
      )}

      {/* ── Workouts ── */}
      <SectionHeader
        title="Workouts"
        onButtonPress={() => router.push('/plan/workout/new')}
        buttonLabel="New Workout"
      />
      {standaloneWorkouts.length === 0 ? (
        <EmptyState message="No workouts yet. Create one to get started." />
      ) : (
        <FlatList
          data={standaloneWorkouts}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <WorkoutCard
              workout={item}
              allExercises={exercises}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.s }} />}
        />
      )}

      {/* ── Exercises ── */}
      <SectionHeader title="Exercises" />
      <Pressable
        style={({ pressed }) => [layout.card, layout.row, pressed && layout.pressedButton]}
        onPress={() => router.push('/plan/exercise')}
      >
        <MaterialCommunityIcons name="view-list-outline" size={20} color={colors.dark.text} />
        <Text style={[typography.body, styles.exerciseActionText]}>View all exercises</Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={colors.dark.textSubtle}
          style={{ marginLeft: 'auto' }}
        />
      </Pressable>

      <View style={{ height: spacing.xl }} />

      <NamePromptModal
        visible={isNewSplitOpen}
        title="New split"
        initialValue=""
        confirmLabel="Create"
        onConfirm={handleCreateSplit}
        onClose={() => setIsNewSplitOpen(false)}
      />
    </ScrollViewContainer>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={typography.caption}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.m,
    // paddingTop determined at runtime due to safe inset
  },
  exerciseActionText: {
    marginLeft: spacing.s,
  },
  emptyState: {
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.s,
  },
});
