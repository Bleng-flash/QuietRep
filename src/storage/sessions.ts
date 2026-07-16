import type { WorkoutSession } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = '@quietrep/sessions';
const ACTIVE_KEY = '@quietrep/activeSession';

/** Returns all finished sessions, newest-first. Used by the History tab */
export async function getSessions(): Promise<WorkoutSession[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

/** Returns a single finished session by id, or null if not found.
 *  Used by the History session-detail screen. Mirrors a future GET /sessions/:id. */
export async function getSessionById(sessionId: string): Promise<WorkoutSession | null> {
  const sessions = await getSessions();
  return sessions.find((session) => session.id === sessionId) ?? null;
}

/** Removes a finished session from history by id. Mirrors a future DELETE /sessions/:id. */
export async function deleteSession(sessionId: string): Promise<void> {
  const sessions = await getSessions();
  await AsyncStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(sessions.filter((session) => session.id !== sessionId)),
  );
}

/** Returns the in-progress session buffer, or null if no session is live. */
export async function getActiveSession(): Promise<WorkoutSession | null> {
  const raw = await AsyncStorage.getItem(ACTIVE_KEY);
  return raw ? JSON.parse(raw) : null;
}

/** Persists the in-progress session buffer (called as the session is edited).
 *  Caller must strip view-model fields (localKey, target*) before writing. */
export async function setActiveSession(session: WorkoutSession): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify(session));
}

/** Removes the active session buffer without writing to history (Discard action). */
export async function clearActiveSession(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_KEY);
}

/** Stamps finishedAt, prepends to history (newest-first), and clears the active buffer.
 *  The session must have view-model fields stripped before calling. */
export async function finishSession(session: WorkoutSession): Promise<void> {
  const finished: WorkoutSession = { ...session, finishedAt: new Date().toISOString() };
  const history = await getSessions();
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([finished, ...history]));
  await clearActiveSession();
}
