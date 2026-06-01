import WorkoutEditor from "@/components/WorkoutEditor";
import { addWorkout } from "@/storage";
import { setPendingNewWorkoutData } from "@/storage/pendingNewWorkout";
import type { WorkoutExercise } from "@/types";
import { router, useLocalSearchParams } from "expo-router";

// When opened with ?embedded=true (from SplitEditor's WorkoutPicker), this screen
// stores workout data in the in-memory module variable instead of writing to storage.
// SplitEditor picks it up on return via useFocusEffect and calls addWorkout on split save.
export default function NewWorkoutScreen() {
  const { embedded } = useLocalSearchParams<{ embedded?: string }>();
  const isEmbeddedMode = embedded === "true";

  async function handleSave(name: string, exercises: WorkoutExercise[]) {
    if (isEmbeddedMode) {
      // Do NOT write to storage yet — SplitEditor creates the workout when the split is saved
      setPendingNewWorkoutData({ name, exercises });
    } else {
      await addWorkout({ name, exercises, isStandalone: true });
    }
    router.back();
  }

  function handleCancel() {
    router.back();
  }

  return (
    <WorkoutEditor
      onSave={handleSave}
      onCancel={handleCancel}
      onCreateExercise={() => router.push("/plan/exercise/new")}
    />
  );
}
