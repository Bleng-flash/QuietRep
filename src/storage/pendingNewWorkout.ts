// In-memory pass-through for embedded workout data during the round-trip navigation
// from SplitEditor → WorkoutEditor (embedded mode) → SplitEditor.
//
// This is NOT AsyncStorage — nothing is persisted. The variable lives only as long
// as the app is running and is cleared as soon as SplitEditor reads it on return.
// Using a module-level variable lets WorkoutEditor hand off data to SplitEditor
// without writing anything to storage before the split's Save button is pressed.

import type { WorkoutExercise } from "@/types";

type PendingWorkoutData = { name: string; exercises: WorkoutExercise[] } | null;

let pendingData: PendingWorkoutData = null;

export function setPendingNewWorkoutData(data: { name: string; exercises: WorkoutExercise[] }): void {
  pendingData = data;
}

export function getPendingNewWorkoutData(): PendingWorkoutData {
  return pendingData;
}

export function clearPendingNewWorkoutData(): void {
  pendingData = null;
}