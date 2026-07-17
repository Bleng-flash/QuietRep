import type {
  DayKey,
  EditableLoggedSet,
  EditableSessionExercise,
  Exercise,
  ExerciseHistorySummary,
  ExercisePerformance,
  LoggedSet,
  MonthlyStatsEntry,
  PlannedSet,
  SessionExercise,
  WorkoutExercise,
  WorkoutSession,
} from '@/types';
import { v4 as uuid } from 'uuid';

/** Maps today's weekday to a DayKey. JS Date.getDay() returns 0 for Sunday, 1 for Monday, etc.
 *  We define a Sunday-first lookup here rather than reusing DAY_KEYS from constants, because
 *  DAY_KEYS is Monday-first (display order for the split UI) and would produce wrong mappings. */
export function getTodayKey(): DayKey {
  const sundayFirstDayKeys: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return sundayFirstDayKeys[new Date().getDay()];
}

/** Creates a blank EditableLoggedSet seeded from a PlannedSet's rep range.
 *  weight and reps start at 0; the planned range is carried as faint target hints in the session UI. */
function plannedSetToEditableLoggedSet(plannedSet: PlannedSet): EditableLoggedSet {
  return {
    weight: 0,
    reps: 0,
    localKey: uuid(),
    targetMinReps: plannedSet.minReps > 0 ? plannedSet.minReps : undefined,
    targetMaxReps: plannedSet.maxReps > 0 ? plannedSet.maxReps : undefined,
  };
}

/** Converts a planned WorkoutExercise list into editable session exercises.
 *  Each PlannedSet becomes a blank EditableLoggedSet carrying the planned rep range as target hints. */
export function seedSessionExercises(
  workoutExercises: WorkoutExercise[],
): EditableSessionExercise[] {
  return workoutExercises.map((workoutExercise) => ({
    exerciseId: workoutExercise.exerciseId,
    sets: workoutExercise.sets.map(plannedSetToEditableLoggedSet),
  }));
}

/** Strips view-model fields (localKey, targetMinReps, targetMaxReps) from an EditableLoggedSet,
 *  returning the canonical LoggedSet shape ready for storage. */
function editableLoggedSetToLoggedSet({ weight, reps }: EditableLoggedSet): LoggedSet {
  return { weight, reps };
}

/** Strips view-model fields from editable session exercises,
 *  returning the canonical SessionExercise shape ready for storage. */
export function stripToCanonicalExercises(
  editableExercises: EditableSessionExercise[],
): SessionExercise[] {
  return editableExercises.map((exercise) => ({
    exerciseId: exercise.exerciseId,
    sets: exercise.sets.map(editableLoggedSetToLoggedSet),
  }));
}

/** Re-attaches fresh localKeys to persisted session exercises so they can be used as editable
 *  view models. Called when hydrating from storage after an app restart mid-session.
 *  No targetMinReps/Max — those are plan-seeding hints and are never persisted to storage. */
export function hydrateSessionExercises(exercises: SessionExercise[]): EditableSessionExercise[] {
  return exercises.map((sessionExercise) => ({
    exerciseId: sessionExercise.exerciseId,
    sets: sessionExercise.sets.map((loggedSet) => ({ ...loggedSet, localKey: uuid() })),
  }));
}

/** Upper bound for the elapsed-time display: 99:59:59. A session that somehow runs longer
 *  (e.g. left going by accident) freezes the timer here rather than widening to three-digit hours. */
const MAX_ELAPSED_SECONDS = 99 * 3600 + 59 * 60 + 59;

/** Formats the elapsed time between startedAt and `now` (ms epoch) as a clock string.
 *  Under an hour it reads mm:ss; from one hour it adds unpadded hours (h:mm:ss for 1-9,
 *  hh:mm:ss for 10-99). Math.max(0, …) guards against clock skew so the timer never shows a
 *  negative value, and the total is capped at MAX_ELAPSED_SECONDS so it never exceeds 99:59:59.
 *
 *  No lag/drift accumulation: elapsed is always recomputed as (now - startedAt), not incremented
 *  by the caller's tick. The ElapsedTimer's setInterval only nudges `now` forward to trigger a
 *  re-render — a late, dropped, or coalesced tick (background tab, JS thread busy) at most delays
 *  when the display updates, never the value it lands on. So the clock stays anchored to real time
 *  and self-corrects on the next tick, rather than slowly falling behind like a counter would. */
export function formatElapsed(startedAtIso: string, now: number): string {
  const elapsedMs = Math.max(0, now - new Date(startedAtIso).getTime());
  const totalSeconds = Math.min(MAX_ELAPSED_SECONDS, Math.floor(elapsedMs / 1000));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');

  if (hours > 0) {
    // Hours are not zero-padded, so 1-9 reads h:mm:ss and 10-99 grows to hh:mm:ss naturally.
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }
  return `${paddedMinutes}:${paddedSeconds}`;
}

/** Formats a session's ISO timestamp as a calendar date for History rows/detail,
 *  e.g. "Mon, Jul 14, 2026". Locale-driven via toLocaleDateString. */
export function formatSessionDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Formats a completed session's total length (startedAt -> finishedAt) in human-readable units,
 *  e.g. "4 hrs 30 mins", "45 mins", or "2 hrs" (minutes omitted when zero). Returns '' when finishedAt
 *  is null (should not happen for a finished session, but the type allows it, so we guard).
 *  Deliberately NOT formatElapsed's clock format (mm:ss) — a browsing summary reads better in words,
 *  whereas formatElapsed drives the live ticking timer where a clock is what's expected. */
export function formatSessionDuration(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return '';
  const { hours, minutes } = msToHoursMinutes(Date.parse(finishedAt) - Date.parse(startedAt));

  const hoursLabel = hours > 0 ? `${hours} hr${hours === 1 ? '' : 's'}` : '';
  // Show minutes when there are any, or when there are no hours at all — so a sub-hour session
  // still reads e.g. "45 mins" and a sub-minute one reads "0 mins" rather than an empty string.
  const minutesLabel =
    minutes > 0 || hours === 0 ? `${minutes} min${minutes === 1 ? '' : 's'}` : '';

  return [hoursLabel, minutesLabel].filter(Boolean).join(' ');
}

/** Splits a millisecond duration into whole hours and remaining minutes (seconds discarded).
 *  Math.max(0, …) guards against clock skew so a negative span never underflows.
 *  Shared by formatSessionDuration (verbose) and formatTotalDuration (compact). */
function msToHoursMinutes(ms: number): { hours: number; minutes: number } {
  const totalMinutes = Math.floor(Math.max(0, ms) / 60000);
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

/** Formats a total duration compactly for the Home dashboard tiles / month rows, e.g. "12h 30m",
 *  "45m", "0m". Deliberately terser than formatSessionDuration's "4 hrs 30 mins" — a small stat
 *  cell reads better in abbreviated units. Hours are omitted when zero; minutes are always shown. */
export function formatTotalDuration(totalMs: number): string {
  const { hours, minutes } = msToHoursMinutes(totalMs);
  const hoursLabel = hours > 0 ? `${hours}h` : '';
  return [hoursLabel, `${minutes}m`].filter(Boolean).join(' ');
}

/** Assembles a canonical WorkoutSession from the context's working state for storage writes.
 *  finishedAt is always null here — storage's finishSession() stamps it on the Finish action. */
export function toCanonicalSession(
  id: string,
  name: string,
  startedAt: string,
  editableExercises: EditableSessionExercise[],
): WorkoutSession {
  return {
    id,
    name,
    startedAt,
    finishedAt: null,
    exercises: stripToCanonicalExercises(editableExercises),
  };
}

/** Aggregates session history into one summary per exercise that has ever been logged, pre-joined
 *  with the exercise catalog for display. Drives the History tab's "By exercise" list. An exercise
 *  never performed is absent; a dangling FK (catalog entry deleted) still appears via a fallback name.
 *  Result is sorted most-recently-trained first.
 *
 *  Pure computation — the client-side stand-in for the GROUP BY a future backend would run.
 *  Components must not call this directly; they go through storage's getExerciseHistorySummaries(),
 *  so at backend transition only that wrapper's internals change. */
export function summarizeExerciseHistory(
  sessions: WorkoutSession[],
  allExercises: Exercise[],
): ExerciseHistorySummary[] {
  const exerciseById = new Map(allExercises.map((exercise) => [exercise.id, exercise]));
  const summaryByExerciseId = new Map<string, ExerciseHistorySummary>();

  for (const session of sessions) {
    // A session may list the same exercise more than once; count it once toward sessionCount.
    const countedInThisSession = new Set<string>();
    for (const sessionExercise of session.exercises) {
      if (countedInThisSession.has(sessionExercise.exerciseId)) continue;
      countedInThisSession.add(sessionExercise.exerciseId);

      const existing = summaryByExerciseId.get(sessionExercise.exerciseId);
      if (existing) {
        summaryByExerciseId.set(sessionExercise.exerciseId, {
          ...existing,
          sessionCount: existing.sessionCount + 1,
          // ISO 8601 strings compare correctly lexicographically, so keep the later timestamp.
          lastPerformedAt:
            session.startedAt > existing.lastPerformedAt
              ? session.startedAt
              : existing.lastPerformedAt,
        });
      } else {
        const exercise = exerciseById.get(sessionExercise.exerciseId);
        summaryByExerciseId.set(sessionExercise.exerciseId, {
          exerciseId: sessionExercise.exerciseId,
          name: exercise?.name ?? 'Unknown exercise',
          muscleGroup: exercise?.muscleGroup ?? 'Other',
          sessionCount: 1,
          lastPerformedAt: session.startedAt,
        });
      }
    }
  }

  return Array.from(summaryByExerciseId.values()).sort((first, second) =>
    second.lastPerformedAt.localeCompare(first.lastPerformedAt),
  );
}

/** Collects every past session in which the given exercise was performed, as one ExercisePerformance
 *  per session (its logged sets). Preserves the newest-first order of the passed-in sessions.
 *  If an exercise appears more than once in a single session, its sets are concatenated into one entry.
 *
 *  Pure computation — the client-side stand-in for the WHERE exercise_id = ? query a future backend
 *  would run. Components must not call this directly; they go through storage's
 *  getExercisePerformances(exerciseId) wrapper (hence "collect", not "get" — get* signals a storage read). */
export function collectExercisePerformances(
  sessions: WorkoutSession[],
  exerciseId: string,
): ExercisePerformance[] {
  const performances: ExercisePerformance[] = [];

  for (const session of sessions) {
    const setsForExercise = session.exercises
      .filter((sessionExercise) => sessionExercise.exerciseId === exerciseId)
      .flatMap((sessionExercise) => sessionExercise.sets);

    if (setsForExercise.length === 0) continue;

    performances.push({
      sessionId: session.id,
      sessionName: session.name,
      performedAt: session.startedAt,
      sets: setsForExercise,
    });
  }

  return performances;
}

/** Aggregates one month's finished sessions into a MonthlyStatsEntry, tagged with the (year, month)
 *  the caller has already resolved. Shared by summarizeMonth and summarizeAllMonths — keeps the
 *  per-metric arithmetic in one place. */
function buildMonthlyStatsEntry(
  sessions: WorkoutSession[],
  year: number,
  month: number,
): MonthlyStatsEntry {
  let totalSets = 0;
  let totalDurationMs = 0;

  for (const session of sessions) {
    for (const sessionExercise of session.exercises) {
      totalSets += sessionExercise.sets.length;
    }
    // A finished session always has finishedAt, but the type allows null, so we guard.
    if (session.finishedAt) {
      totalDurationMs += Math.max(
        0,
        Date.parse(session.finishedAt) - Date.parse(session.startedAt),
      );
    }
  }

  return { year, month, workoutCount: sessions.length, totalSets, totalDurationMs };
}

/** Aggregates the finished sessions performed in referenceDate's calendar month (default: now) into
 *  the three Home-dashboard metrics. A session is attributed to the month it was STARTED, not
 *  finished, so one spanning midnight into a new month (e.g. start 31 Jul 23:50, finish 1 Aug 01:30)
 *  counts in the month it was actually performed. The !finishedAt guard still excludes in-flight
 *  sessions (history only holds completed ones, but the type allows null).
 *
 *  Pure computation — the client-side stand-in for a server-side
 *  `GROUP BY date_trunc('month', started_at)` filtered to the current month. `month` is a derived
 *  expression over the timestamp, never a stored column — the DB truncates it just as we do here.
 *  Components must not call this directly; they go through storage's getCurrentMonthSummary(). */
export function summarizeMonth(
  sessions: WorkoutSession[],
  referenceDate: Date = new Date(),
): MonthlyStatsEntry {
  const targetYear = referenceDate.getFullYear();
  const targetMonth = referenceDate.getMonth();

  const sessionsThisMonth = sessions.filter((session) => {
    if (!session.finishedAt) return false;
    const startedDate = new Date(session.startedAt);
    return startedDate.getFullYear() === targetYear && startedDate.getMonth() === targetMonth;
  });

  return buildMonthlyStatsEntry(sessionsThisMonth, targetYear, targetMonth);
}

/** Groups finished sessions by calendar month and aggregates each into a MonthlyStatsEntry.
 *  One entry per month that has at least one session (gap months skipped), sorted newest-first —
 *  so the last entry is the first recorded session's month and the first entry is the most recent.
 *  A session is attributed to the month it was STARTED (see summarizeMonth), so a cross-midnight
 *  session lands in the month it was performed rather than the month it happened to finish.
 *
 *  Pure computation — the client-side stand-in for a server-side
 *  `GROUP BY date_trunc('month', started_at)` (month is a derived expression over the timestamp,
 *  not a stored column). Components must not call this directly; they go through storage's
 *  getMonthlyStatsHistory(). */
export function summarizeAllMonths(sessions: WorkoutSession[]): MonthlyStatsEntry[] {
  // Bucket sessions by "year-month" strings so each distinct calendar month is aggregated exactly once.
  // eg. monthKey of "2026-0" represents January 2026 (JS Date months is represented from 0 - 11)
  const sessionsByMonthKey = new Map<string, WorkoutSession[]>();
  for (const session of sessions) {
    if (!session.finishedAt) continue;
    const startedDate = new Date(session.startedAt);
    const monthKey = `${startedDate.getFullYear()}-${startedDate.getMonth()}`;
    const bucket = sessionsByMonthKey.get(monthKey);
    if (bucket) {
      bucket.push(session);
    } else {
      sessionsByMonthKey.set(monthKey, [session]);
    }
  }

  const entries: MonthlyStatsEntry[] = [];
  for (const [monthKey, monthSessions] of sessionsByMonthKey) {
    const [year, month] = monthKey.split('-').map(Number);
    entries.push(buildMonthlyStatsEntry(monthSessions, year, month));
  }

  // Newest-first: sort by year, then month, both descending.
  return entries.sort((first, second) =>
    first.year !== second.year ? second.year - first.year : second.month - first.month,
  );
}
