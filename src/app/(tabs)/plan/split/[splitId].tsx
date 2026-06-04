import SplitEditor from '@/components/SplitEditor';
import {
  clearActiveSplit,
  deleteWorkoutsByIds,
  deleteSplit,
  getActiveSplitId,
  getSplits,
  getWorkouts,
  setActiveSplit,
  updateSplit,
} from '@/storage';
import { DAY_KEYS } from '@/constants/days';
import { colors, layout } from '@/styles';
import type { DayKey, Split, Workout } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function SplitDetailScreen() {
  const { splitId } = useLocalSearchParams<{ splitId: string }>();

  const [split, setSplit] = useState<Split | null>(null);
  const [resolvedDayWorkouts, setResolvedDayWorkouts] = useState<Record<DayKey, Workout[]> | null>(
    null,
  );
  const [isActiveSplit, setIsActiveSplit] = useState(false);

  useEffect(() => {
    async function loadSplit() {
      const [allSplits, allWorkouts, activeSplitId] = await Promise.all([
        getSplits(),
        getWorkouts(),
        getActiveSplitId(),
      ]);

      const foundSplit = allSplits.find((thisSplit) => thisSplit.id === splitId);
      if (!foundSplit) return;

      // Resolve each day's workout ids to full Workout objects
      const dayWorkouts = {} as Record<DayKey, Workout[]>;
      for (const dayKey of DAY_KEYS) {
        dayWorkouts[dayKey] = (foundSplit.days[dayKey] ?? [])
          .map((workoutId) => allWorkouts.find((workout) => workout.id === workoutId))
          .filter((workout): workout is Workout => Boolean(workout));
      }

      setSplit(foundSplit);
      setResolvedDayWorkouts(dayWorkouts);
      setIsActiveSplit(foundSplit.id === activeSplitId);
    }
    loadSplit();
  }, [splitId]);

  async function handleSave(name: string, days: Record<DayKey, string[]>, setAsActive: boolean) {
    if (!split) return;
    await updateSplit({ ...split, name, days });
    if (setAsActive) {
      await setActiveSplit(splitId);
    } else if (isActiveSplit) {
      // User toggled active off — clear it
      await clearActiveSplit();
    }
    router.back();
  }

  async function handleDelete() {
    if (!split) return;
    // Cascade-delete all embedded workouts before deleting the split
    const allEmbeddedIds = Object.values(split.days).flat();
    await deleteWorkoutsByIds(allEmbeddedIds);
    await deleteSplit(splitId);
    router.back();
  }

  if (!split || !resolvedDayWorkouts) {
    return (
      <View style={layout.centered}>
        <ActivityIndicator color={colors.dark.primary} />
      </View>
    );
  }

  return (
    <SplitEditor
      initialSplit={split}
      initialDayWorkouts={resolvedDayWorkouts}
      isInitiallyActive={isActiveSplit}
      onSave={handleSave}
      onCancel={() => router.back()}
      onCreateWorkout={() => router.push('/plan/workout/new?embedded=true')}
      onDelete={handleDelete}
    />
  );
}
