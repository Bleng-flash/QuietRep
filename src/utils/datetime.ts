import type { DayKey } from '@/types';

/** Maps today's weekday to a DayKey. JS Date.getDay() returns 0 for Sunday, 1 for Monday, etc.
 *  We define a Sunday-first lookup here rather than reusing DAY_KEYS from constants, because
 *  DAY_KEYS is Monday-first (display order for the split UI) and would produce wrong mappings. */
export function getTodayKey(): DayKey {
  const sundayFirstDayKeys: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return sundayFirstDayKeys[new Date().getDay()];
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
