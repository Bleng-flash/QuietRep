import WorkoutEditor from '@/components/WorkoutEditor';
import { addWorkout, addWorkoutToSplit } from '@/storage';
import type { DayKey, WorkoutExercise } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';

// Two modes:
//  - Default: create a standalone workout shown in the Workouts section.
//  - Embedded (opened with ?splitId=<id>&day=<day> from a SplitCard's day picker): create an
//    embedded copy and attach it to that split day via addWorkoutToSplit.
export default function NewWorkoutScreen() {
  const { splitId, day } = useLocalSearchParams<{ splitId?: string; day?: DayKey }>();
  const isEmbedded = splitId !== undefined && day !== undefined;

  async function handleSave(name: string, exercises: WorkoutExercise[]) {
    if (isEmbedded) {
      await addWorkoutToSplit(splitId, day, { name, exercises });
    } else {
      await addWorkout({ name, exercises, isStandalone: true });
    }
    router.back();
  }

  return <WorkoutEditor onSave={handleSave} />;
}