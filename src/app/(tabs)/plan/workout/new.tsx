import WorkoutEditor from '@/components/WorkoutEditor';
import { addWorkout } from '@/storage';
import type { WorkoutExercise } from '@/types';
import { router } from 'expo-router';

// When opened with ?embedded=true (from SplitEditor's WorkoutPicker), this screen
// stores workout data in the in-memory module variable instead of writing to storage.
// SplitEditor picks it up on return via useFocusEffect and calls addWorkout on split save.
export default function NewWorkoutScreen() {
  async function handleSave(name: string, exercises: WorkoutExercise[]) {
    await addWorkout({ name, exercises, isStandalone: true });
    // if added from splits, set isStandalone to false
    router.back();
  }

  function handleCancel() {
    router.back();
  }

  return (
    <WorkoutEditor
      onSave={handleSave}
      onCancel={handleCancel}
      onCreateExercise={() => router.push('/plan/exercise/new')}
    />
  );
}
