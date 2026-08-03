// Text-input sanitisers, shared by the plan editor and the live session logger.
//
// These are the FIRST of the two validation layers: they constrain the character class of what a
// field can hold, so malformed input is impossible by construction rather than merely blocked by
// the keyboard (which paste and external keyboards bypass). They deliberately never clamp
// MAGNITUDE — a too-large number is a real value the user typed and may want to correct, so it is
// surfaced as a save-time error instead of being silently rewritten. That second layer lives in
// isPlannedSetValid / isLoggedSetValid.

/** Strips anything that is not a digit, so a reps field can only ever hold a non-negative integer
 *  (negatives, decimals, and pasted letters are impossible by construction).
 *
 *  The MAX_REPS cap — and, on the plan side, minReps <= maxReps — are deliberately NOT enforced
 *  here; both surface as a save-time error with a red row highlight (isPlannedSetValid in the
 *  workout editor, isLoggedSetValid in the live session).
 *  Shared by the plan editor (PlannedSetRow) and the live-session logger (LoggedSetRow). */
export function sanitizeReps(text: string): string {
  return text.replace(/\D/g, ''); // replace every character that is not a digit 0-9 with ''
}

/** Keeps digits and at most one decimal point, so a weight input only ever holds a valid
 *  non-negative decimal (e.g. "53.75") — negatives, letters, and extra dots are impossible by
 *  construction, not merely blocked by the keyboard. A trailing "53." is preserved so mid-typing
 *  works; parseFloat tolerates it. The MAX_WEIGHT magnitude cap is enforced by the caller, not here.
 *  Shared by the live-session logger (LoggedSetRow) and the bodyweight logger (LogBodyweightCard). */
export function sanitizeWeight(text: string): string {
  const cleaned = text.replace(/[^0-9.]/g, ''); // strips any chars that are not 0-9 or a dot
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) return cleaned;
  // Keep the first decimal point, strip any subsequent ones.
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
}
