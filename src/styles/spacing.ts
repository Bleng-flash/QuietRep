export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

/**
 * Used for: any padding, margin, gap, or positional offset across the entire app.
 * Keeps all whitespace on a consistent scale — buttons, list items, card padding, screen edges, spacing between form fields.
 *
 * The named constants below are not part of that scale — they are fixed element widths
 * shared across files, kept here so the one value lives in one place.
 */

/**
 * Gap between the safe-area top inset and the first content on a tab index screen, applied as
 * `insets.top + SCREEN_TOP_GAP` inline (never inside StyleSheet.create — useSafeAreaInsets is a
 * runtime value). One constant so the four tab screens keep a shared rhythm and the gap is tuned
 * in one place. Non-index screens keep the tighter `insets.top + spacing.s`: a compact top bar
 * with a back chevron is chrome, not page content, and wants less breathing room above it.
 */
export const SCREEN_TOP_GAP = spacing.l;

/**
 * Width of the leading "Set N" label column, shared by every set-row grid so the editable rows
 * (PlannedSetRow, LoggedSetRow) and their read-only counterparts stay in vertical alignment.
 * Each card's column-header row reserves the same width with a spacer View.
 */
export const SET_LABEL_COLUMN_WIDTH = 48;

/**
 * Width of the trailing remove-button column in the editable set rows, reserved by a spacer in
 * the matching column header. The read-only cards omit this column entirely — nothing to remove.
 * Not to be confused with DayWorkoutList's own narrower remove column, which is unrelated.
 */
export const SET_REMOVE_COLUMN_WIDTH = 32;
