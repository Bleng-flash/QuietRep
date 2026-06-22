import WorkoutEditor from '@/components/plan/WorkoutEditor';
import { deleteWorkout, getWorkoutById, updateWorkout } from '@/storage';
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
        const foundWorkout = await getWorkoutById(workoutId);
        // getWorkoutById returns null for "not found"; component state uses undefined for "not yet
        // loaded" — both render the same spinner. "Not found" is a degenerate path in practice
        // since this screen is only reachable via a WorkoutCard for an existing workout.
        setWorkout(foundWorkout ?? undefined);
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
      <View style={[layout.screen, layout.centered]}>
        <ActivityIndicator color={colors.dark.primary} />
      </View>
    );
  }

  return (
    <WorkoutEditor
      initialWorkout={workout}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
}
