import type { Split } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuid } from "uuid";

const KEY = "@quietrep/splits";
const ACTIVE_KEY = "@quietrep/activeSplit";

export async function getSplits(): Promise<Split[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function addSplit(data: Omit<Split, "id">): Promise<Split> {
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

export async function deleteSplit(id: string): Promise<void> {
  const all = await getSplits();
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify(all.filter((split) => split.id !== id)),
  );
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
