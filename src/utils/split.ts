import { DAY_KEYS } from '@/constants/days';
import type { DayKey } from '@/types';

// Fresh, fully-populated days object for a new split — every day starts as an empty
// array (rest day). Each call returns a new object so callers never share a reference.
export function createEmptyDays(): Record<DayKey, string[]> {
  return DAY_KEYS.reduce(
    (days, day) => ({ ...days, [day]: [] }),
    {} as Record<DayKey, string[]>,
  );
}