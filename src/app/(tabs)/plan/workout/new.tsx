import WorkoutEditor from "@/components/WorkoutEditor";
import { addWorkout } from "@/storage";
import type { WorkoutExercise } from "@/types";
import { router } from "expo-router";

export default function NewWorkoutScreen() {
  async function handleSave(name: string, exercises: WorkoutExercise[]) {
    await addWorkout({ name, exercises, isStandalone: true });
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
