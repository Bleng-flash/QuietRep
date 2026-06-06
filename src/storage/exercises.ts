import { DEFAULT_EXERCISES } from '@/constants/defaultExercises';
import type { Exercise } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { v4 as uuid } from 'uuid';

const DEFAULTS_KEY = '@quietrep/defaultExercises';
const USER_KEY = '@quietrep/userExercises';

export async function getDefaultExercises(): Promise<Exercise[]> {
  const defaultRaw = await AsyncStorage.getItem(DEFAULTS_KEY);
  const defaultExercises: Exercise[] = defaultRaw ? JSON.parse(defaultRaw) : [];
  return defaultExercises;
}

export async function getUserExercises(): Promise<Exercise[]> {
  const userRaw = await AsyncStorage.getItem(USER_KEY);
  const userExercises: Exercise[] = userRaw ? JSON.parse(userRaw) : [];
  return userExercises;
}

// Returns all exercises — defaults first, then user-created.
export async function getAllExercises(): Promise<Exercise[]> {
  const [defaultExercises, userExercises] = await Promise.all([
    getDefaultExercises(),
    getUserExercises(),
  ]);
  return [...defaultExercises, ...userExercises];
}

// Adds a user-created exercise. Returns null (and shows an Alert) if an exercise
// with the same name already exists — name uniqueness is enforced across both
// default and user exercises since the picker shows them together.
export async function addExercise(data: Omit<Exercise, 'id'>): Promise<Exercise | null> {
  // Parallel reads so we have both lists without a redundant third read at write time.
  const [defaultExercises, userExercises] = await Promise.all([
    getDefaultExercises(),
    getUserExercises(),
  ]);

  const existingExercise = [...defaultExercises, ...userExercises].find(
    (exercise) => exercise.name.toLowerCase() === data.name.toLowerCase(),
  );
  
  if (existingExercise) {
    Alert.alert(
      'Name already exists',
      `An exercise called "${existingExercise.name}" already exists.`,
    );
    return null;
  }

  const newExercise: Exercise = { ...data, id: uuid() };
  await AsyncStorage.setItem(USER_KEY, JSON.stringify([...userExercises, newExercise]));
  return newExercise;
}

// Do not provide updateExercise because of conflicts with uniqueness enforcement of name
// and deleting + re-adding is trivial for users

// Deletes a user-created exercise by id. Default exercises are not deletable.
export async function deleteExercise(id: string): Promise<void> {
  const userExercises: Exercise[] = await getUserExercises();
  await AsyncStorage.setItem(
    USER_KEY,
    JSON.stringify(userExercises.filter((exercise) => exercise.id !== id)),
  );
}

/* 
  Seeds any default exercises not yet in storage. Runs on every app launch but
  only writes missing entries — so adding new defaults in a future update reaches
  existing users without touching their custom exercises.
  Both keys are checked when building existingNames to handle the edge case where
  a user-created exercise shares a name with a newly added default: we skip
  seeding it to avoid duplicates. 
  If the user later deletes their custom version, the next launch will find 
  the name absent from both keys and seed it then as a default exercise.
*/
export async function seedDefaultExercises(): Promise<void> {
  const [storedDefaults, userExercises] = await Promise.all([
    getDefaultExercises(),
    getUserExercises(),
  ]);

  const existingNames = new Set([
    ...storedDefaults.map((exercise) => exercise.name.toLowerCase()),
    ...userExercises.map((exercise) => exercise.name.toLowerCase()),
  ]);

  const updatedDefaults = [...storedDefaults];

  // Do not call addExercise here repeatedly
  for (const exercise of DEFAULT_EXERCISES) {
    if (!existingNames.has(exercise.name.toLowerCase())) {
      updatedDefaults.push({ ...exercise, id: uuid() });
    }
  }
  await AsyncStorage.setItem(DEFAULTS_KEY, JSON.stringify(updatedDefaults));
}
