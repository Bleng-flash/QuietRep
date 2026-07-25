import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScrollViewContainer } from 'react-native-reorderable-list';

import SplitCard from '@/components/plan/SplitCard';
import EmptyState from '@/components/shared/EmptyState';
import NamePromptModal from '@/components/shared/NamePromptModal';
import SectionHeader from '@/components/shared/SectionHeader';
import WorkoutCard from '@/components/shared/WorkoutCard';
import { useTheme } from '@/context/ThemeContext';
import { addSplit, getActiveSplitId, getAllExercises, getSplits, getWorkouts } from '@/storage';
import { SCREEN_TOP_GAP, spacing } from '@/styles';
import type { Exercise, Split, Workout } from '@/types';
import { createEmptyDays } from '@/utils/split';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PlanScreen() {
  const { colors, layout, typography } = useTheme();
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
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + SCREEN_TOP_GAP }]}
      showsVerticalScrollIndicator={false}
      // The Plan screen has no inline inputs, but RN's responder system walks the REACT tree —
      // crossing Modal boundaries — so this container governs taps inside NamePromptModal
      // (create/rename split) and WorkoutPicker while their keyboards are up. Without "handled",
      // the default swallows the first tap on Save/Cancel to dismiss the keyboard.
      keyboardShouldPersistTaps="handled"
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
        <EmptyState
          icon="calendar-outline"
          title="No splits yet"
          message="Build a weekly split to plan which workouts land on which day."
        />
      ) : (
        <FlatList
          data={splits}
          keyExtractor={(item) => item.id}
          // disable FlatList's own scroll container so the outer ScrollView
          // (which wraps the whole screen) handles scrolling instead
          scrollEnabled={false}
          // Responder capture runs outer->inner, so the outer container's "handled" cannot help
          // content under THIS list: SplitCard's rename NamePromptModal and WorkoutPicker are
          // React-descendants of it, and without "handled" it swallows their first tap while
          // the keyboard is up (see the outer ScrollViewContainer comment).
          keyboardShouldPersistTaps="handled"
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
        <EmptyState
          icon="clipboard-outline"
          title="No workouts yet"
          message="Create a workout template to reuse in your splits and workout sessions."
        />
      ) : (
        <FlatList
          data={standaloneWorkouts}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          // Same as the splits list above — no input modals under this list today, but any
          // future one would silently regress to two-tap without it.
          keyboardShouldPersistTaps="handled"
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
        <MaterialCommunityIcons name="view-list-outline" size={20} color={colors.text} />
        <Text style={[typography.body, styles.exerciseActionText]}>View all exercises</Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={colors.textSubtle}
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

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.m,
    // paddingTop is applied inline as insets.top + SCREEN_TOP_GAP — the inset is a runtime value
  },
  exerciseActionText: {
    marginLeft: spacing.s,
  },
});
