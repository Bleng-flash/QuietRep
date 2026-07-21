import type {
  Exercise,
  ExerciseHistorySummary,
  ExercisePerformance,
  MonthlyStatsEntry,
  WorkoutSession,
} from '@/types';

/** Pure derived-read aggregations over session history — the client-side stand-ins for the
 *  GROUP BY / WHERE queries a future backend would run. Components must NOT call these directly;
 *  each sits behind a storage wrapper (getExerciseHistorySummaries, getExercisePerformances,
 *  getCurrentMonthSummary, getMonthlyStatsHistory) so that at backend transition only the wrapper
 *  internals change. Naming: summarize* / collect* signals a pure computation, get* a storage read. */

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
      // Carried across for the same reason sessionName is: this record is flat, so the
      // parent session (and its unit) is unreachable from the consuming card.
      unit: session.unit,
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
