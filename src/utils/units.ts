import type { WeightUnit } from '@/types';

// Exact by international definition (1 lb = 0.45359237 kg), not a tunable value, and used only
// here — hence module-private rather than a src/constants entry, which would advertise it as
// configurable.
const KG_PER_LB = 0.45359237;

// A display concern of formatWeight below, with one consumer. Same reasoning as KG_PER_LB.
const WEIGHT_DISPLAY_DECIMALS = 2;

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

/** Converts a weight from the unit it was logged in to the unit the viewer is reading in.
 *
 *  Short-circuits when the units match, returning the number untouched. That matters: a user
 *  who never switches units gets exactly the values they typed back, with no float round-trip
 *  drift, forever. Only someone who actually switches ever sees converted arithmetic. */
export function convertWeight(
  weight: number,
  loggedUnit: WeightUnit,
  displayUnit: WeightUnit,
): number {
  if (loggedUnit === displayUnit) return weight;
  return loggedUnit === 'kg' ? weight / KG_PER_LB : weight * KG_PER_LB;
}

/** Converts and renders a weight for display, without a unit suffix — the caller's column
 *  header carries the unit, so repeating it on every row would be noise.
 *
 *  toFixed caps the precision, then Number() drops any trailing zeros it introduced, so a whole
 *  number stays bare ("100", not "100.00") while a converted value is capped ("220.46"). */
export function formatWeight(
  weight: number,
  loggedUnit: WeightUnit,
  displayUnit: WeightUnit,
): string {
  const converted = convertWeight(weight, loggedUnit, displayUnit);
  return String(Number(converted.toFixed(WEIGHT_DISPLAY_DECIMALS)));
}
