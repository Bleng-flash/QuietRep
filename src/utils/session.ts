import type {
  DayKey,
  EditableLoggedSet,
  EditableSessionExercise,
  Exercise,
  ExerciseHistorySummary,
  ExercisePerformance,
  LoggedSet,
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
  const elapsedMs = Math.max(0, Date.parse(finishedAt) - Date.parse(startedAt));
  const totalMinutes = Math.floor(elapsedMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const hoursLabel = hours > 0 ? `${hours} hr${hours === 1 ? '' : 's'}` : '';
  // Show minutes when there are any, or when there are no hours at all — so a sub-hour session
  // still reads e.g. "45 mins" and a sub-minute one reads "0 mins" rather than an empty string.
  const minutesLabel =
    minutes > 0 || hours === 0 ? `${minutes} min${minutes === 1 ? '' : 's'}` : '';

  return [hoursLabel, minutesLabel].filter(Boolean).join(' ');
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
