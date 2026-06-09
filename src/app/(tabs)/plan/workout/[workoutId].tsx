import WorkoutEditor from '@/components/WorkoutEditor';
import { deleteWorkout, getWorkouts, updateWorkout } from '@/storage';
import { colors, layout } from '@/styles';
import type { Workout, WorkoutExercise } from '@/types';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function EditWorkoutScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const [workout, setWorkout] = useState<Workout | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      async function loadWorkout() {
        const allWorkouts = await getWorkouts();
        setWorkout(allWorkouts.find((workout) => workout.id === workoutId));
      }
      loadWorkout();
    }, [workoutId])
  );

  async function handleSave(name: string, exercises: WorkoutExercise[]) {
    if (!workout) return;
    await updateWorkout({ ...workout, name, exercises });
    router.back();
  }

  async function handleDelete() {
    await deleteWorkout(workoutId);
    router.back();
  }

  // Show a spinner while the async load is in flight — workout is undefined until loadWorkout resolves
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
      onDelete={handleDelete}
    />
  );
}
