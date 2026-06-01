import SplitEditor from "@/components/SplitEditor";
import { addSplit, setActiveSplit } from "@/storage";
import type { DayKey, Workout } from "@/types";
import { router } from "expo-router";

const EMPTY_DAY_WORKOUTS: Record<DayKey, Workout[]> = {
  mon: [],
  tue: [],
  wed: [],
  thu: [],
  fri: [],
  sat: [],
  sun: [],
};

export default function NewSplitScreen() {
  async function handleSave(
    name: string,
    days: Record<DayKey, string[]>,
    setAsActive: boolean,
  ) {
    const newSplit = await addSplit({ name, days });
    if (setAsActive) {
      await setActiveSplit(newSplit.id);
    }
    router.back();
  }

  return (
    <SplitEditor
      initialDayWorkouts={EMPTY_DAY_WORKOUTS}
      isInitiallyActive={false}
      onSave={handleSave}
      onCancel={() => router.back()}
      onCreateWorkout={() => router.push("/plan/workout/new?embedded=true")}
    />
  );
}