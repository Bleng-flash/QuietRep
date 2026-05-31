import type { Exercise } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuid } from "uuid";

const KEY = "@quietrep/exercises";

export async function getExercises(): Promise<Exercise[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function addExercise(
  data: Omit<Exercise, "id">,
): Promise<Exercise> {
  const all = await getExercises();
  const exercise: Exercise = { ...data, id: uuid() };
  await AsyncStorage.setItem(KEY, JSON.stringify([...all, exercise]));
  return exercise;
}

export async function updateExercise(updated: Exercise): Promise<void> {
  const all = await getExercises();
  const next = all.map((ex) => (ex.id === updated.id ? updated : ex));
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function deleteExercise(id: string): Promise<void> {
  const all = await getExercises();
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify(all.filter((ex) => ex.id !== id)),
  );
}
