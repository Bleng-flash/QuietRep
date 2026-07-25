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
 */

/**
 * Gap between the safe-area top inset and the first content on a tab index screen, applied as
 * `insets.top + SCREEN_TOP_GAP` inline (never inside StyleSheet.create — useSafeAreaInsets is a
 * runtime value). One constant so the four tab screens keep a shared rhythm and the gap is tuned
 * in one place. Non-index screens keep the tighter `insets.top + spacing.s`: a compact top bar
 * with a back chevron is chrome, not page content, and wants less breathing room above it.
 */
export const SCREEN_TOP_GAP = spacing.l;
