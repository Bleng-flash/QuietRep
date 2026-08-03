import type {
  ExerciseHistorySummary,
  ExercisePerformance,
  MonthlyStatsEntry,
  WorkoutSession,
} from '@/types';
import {
  collectExercisePerformances,
  summarizeAllMonths,
  summarizeExerciseHistory,
  summarizeMonth,
} from '@/utils/sessionStats';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllExercises } from './exercises';

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

/** Returns one summary per exercise that appears in session history, most-recently-trained first.
 *  Drives the History tab's "By exercise" browse list. Mirrors a future GET /exercises/history-summary.
 *  Today the aggregation a backend database would do (GROUP BY exercise) runs client-side via
 *  summarizeExerciseHistory; at backend transition only this function's internals change. */
export async function getExerciseHistorySummaries(): Promise<ExerciseHistorySummary[]> {
  const [sessions, allExercises] = await Promise.all([getSessions(), getAllExercises()]);
  return summarizeExerciseHistory(sessions, allExercises);
}

/** Returns every past session in which the given exercise was performed (its logged sets),
 *  newest-first. Drives the exercise-history detail screen. Mirrors a future
 *  GET /exercises/:id/performances. Today the filtering a backend database would do runs
 *  client-side via collectExercisePerformances; at backend transition only the internals change.
 *
 *  `limit` caps the result to the N most recent performances (the list is already newest-first),
 *  mirroring a future `?limit=` query param. How many records to fetch is a query concern, so it
 *  belongs here rather than as a slice in the consuming component. Omit it for the full history —
 *  the exercise-history screen does; the in-session history sheet passes 3.
 *
 *  Note this reads finished sessions only: the in-progress buffer lives under a separate
 *  AsyncStorage key, so a live session never appears in its own "past performances". */
export async function getExercisePerformances(
  exerciseId: string,
  limit?: number,
): Promise<ExercisePerformance[]> {
  const sessions = await getSessions();
  const performances = collectExercisePerformances(sessions, exerciseId);
  return limit === undefined ? performances : performances.slice(0, limit);
  // if performances.length < limit, the .slice method automatically COPIES the whole array.
  // .slice always returns a new array copy
}

/** Returns the aggregated stats for the current calendar month, powering the Home dashboard.
 *  Mirrors a future GET /sessions/monthly-summary. Today the GROUP BY a backend would run happens
 *  client-side via summarizeMonth; at backend transition only this function's internals change. */
export async function getCurrentMonthSummary(): Promise<MonthlyStatsEntry> {
  const sessions = await getSessions();
  return summarizeMonth(sessions);
}

/** Returns per-month aggregated stats, newest-first, one entry per month that has sessions.
 *  Drives the Home tab's monthly-history drill-down. Mirrors a future GET /sessions/monthly-stats.
 *  Today the GROUP BY month a backend would run happens client-side via summarizeAllMonths. */
export async function getMonthlyStatsHistory(): Promise<MonthlyStatsEntry[]> {
  const sessions = await getSessions();
  return summarizeAllMonths(sessions);
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
