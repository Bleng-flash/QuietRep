import type { BodyweightEntry } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuid } from 'uuid';

const KEY = '@quietrep/bodyweight';

// Stored newest-first: addBodyweightEntry prepends, so on-disk order is the display order.
export async function getBodyweightEntries(): Promise<BodyweightEntry[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function addBodyweightEntry(data: Omit<BodyweightEntry, 'id'>): Promise<BodyweightEntry> {
  const allEntries = await getBodyweightEntries();
  const newEntry: BodyweightEntry = { ...data, id: uuid() };
  await AsyncStorage.setItem(KEY, JSON.stringify([newEntry, ...allEntries]));
  return newEntry;
}

export async function deleteBodyweightEntry(id: string): Promise<void> {
  const allEntries = await getBodyweightEntries();
  await AsyncStorage.setItem(KEY, JSON.stringify(allEntries.filter((entry) => entry.id !== id)));
}
