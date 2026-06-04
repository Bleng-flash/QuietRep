import WorkoutEditor from '@/components/WorkoutEditor';
import { deleteWorkout, getWorkouts, updateWorkout } from '@/storage';
import { colors, layout } from '@/styles';
import type { Workout, WorkoutExercise } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function EditWorkoutScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const [workout, setWorkout] = useState<Workout | undefined>(undefined);

  // Stack screen — plain useEffect with [] is correct here.
  useEffect(() => {
    async function loadWorkout() {
      const allWorkouts = await getWorkouts();
      setWorkout(allWorkouts.find((workout) => workout.id === workoutId));
    }
    loadWorkout();
  }, [workoutId]);

  async function handleSave(name: string, exercises: WorkoutExercise[]) {
    if (!workout) return;
    await updateWorkout({ ...workout, name, exercises });
    router.back();
  }

  async function handleDelete() {
    await deleteWorkout(workoutId);
    router.back();
  }

  if (!workout) {
    return (
      <View style={[layout.centered, { backgroundColor: colors.dark.background }]}>
        <ActivityIndicator color={colors.dark.primary} />
      </View>
    );
  }

  return (
    <WorkoutEditor
      initialWorkout={workout}
      onSave={handleSave}
      onCancel={() => router.back()}
      onCreateExercise={() => router.push('/plan/exercise/new')}
      onDelete={handleDelete}
    />
  );
}
