import type { DayKey, Split, Workout } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuid } from 'uuid';
import { addWorkout } from './workouts';

const KEY = '@quietrep/splits';
const ACTIVE_KEY = '@quietrep/activeSplit';

export async function getSplits(): Promise<Split[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function addSplit(data: Omit<Split, 'id'>): Promise<Split> {
  const all = await getSplits();
  const split: Split = { ...data, id: uuid() };
  await AsyncStorage.setItem(KEY, JSON.stringify([...all, split]));
  return split;
}

export async function updateSplit(updated: Split): Promise<void> {
  const all = await getSplits();
  const next = all.map((split) => (split.id === updated.id ? updated : split));
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

// Create an embedded workout copy (isStandalone: false, fresh id) and attach it to one split
// day in a single operation. Used both when building a brand-new workout for a day and when
// assigning a copy of an existing standalone workout. Takes splitId (not a Split) so it always
// appends to the freshest stored state — avoiding a stale-snapshot lost update — and so callers
// holding only an id (the new-workout screen) don't have to re-fetch. No-op if the split is gone.
export async function addWorkoutToSplit(
  splitId: string,
  day: DayKey,
  workoutData: Pick<Workout, 'name' | 'exercises'>,
  // Pick<T, K> is a typescript utility that constructs a new type by slecting only the
  // keys K from type T 
): Promise<void> {
  const embeddedWorkout = await addWorkout({ ...workoutData, isStandalone: false });
  const splits = await getSplits();
  const targetSplit = splits.find((split) => split.id === splitId);
  if (!targetSplit) return;
  await updateSplit({
    ...targetSplit,
    days: { ...targetSplit.days, [day]: [...targetSplit.days[day], embeddedWorkout.id] },
  });
}

export async function deleteSplit(id: string): Promise<void> {
  const all = await getSplits();
  await AsyncStorage.setItem(KEY, JSON.stringify(all.filter((split) => split.id !== id)));
  const active = await getActiveSplitId();
  if (active === id) await clearActiveSplit();
}

export async function getActiveSplitId(): Promise<string | null> {
  return AsyncStorage.getItem(ACTIVE_KEY);
}

export async function setActiveSplit(id: string): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_KEY, id);
}

export async function clearActiveSplit(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_KEY);
}
