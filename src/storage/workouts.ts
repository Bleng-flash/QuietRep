import type { Workout } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuid } from "uuid";

const KEY = "@quietrep/workouts";

export async function getWorkouts(): Promise<Workout[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function addWorkout(data: Omit<Workout, "id">): Promise<Workout> {
  const all = await getWorkouts();
  const workout: Workout = { ...data, id: uuid() };
  await AsyncStorage.setItem(KEY, JSON.stringify([...all, workout]));
  return workout;
}

export async function updateWorkout(updated: Workout): Promise<void> {
  const all = await getWorkouts();
  const next = all.map((workout) =>
    workout.id === updated.id ? updated : workout,
  );
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function deleteWorkout(id: string): Promise<void> {
  const all = await getWorkouts();
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify(all.filter((workout) => workout.id !== id)),
  );
}

// Batch-delete multiple workouts by id. Used to cascade-delete embedded workouts when their split is deleted.
export async function deleteWorkoutsByIds(ids: string[]): Promise<void> {
  const all = await getWorkouts();
  const idSet = new Set(ids);
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify(all.filter((workout) => !idSet.has(workout.id))),
  );
}
