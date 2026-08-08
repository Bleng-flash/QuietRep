import { PixelRatio, type TextStyle } from 'react-native';

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
 * and heights shared across files, kept here so the one value lives in one place.
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

/**
 * Minimum heights for single-line TextInputs, in two tiers: INPUT_MIN_HEIGHT for standard bordered
 * fields, COMPACT_INPUT_MIN_HEIGHT for the dense set rows and the session title.
 *
 * MODULE-PRIVATE on purpose — the public surface is INPUT_SLACK / COMPACT_INPUT_SLACK below. A
 * height floor alone is not the fix, and offering it alone is precisely what let three fields ship
 * with the floor but no paddingVertical: 0. Same reasoning as readAllExercises() in storage: the
 * incomplete primitive stays unexported so no caller can reach for it by mistake. If something that
 * is genuinely not a TextInput ever needs to match an input's height, export it then and say why.
 *
 * Load-bearing, not cosmetic. React Native measures an input's box with Typeface.DEFAULT while the
 * native EditText draws the glyphs with the theme's typeface, so on an android device where those differ (a
 * vendor font picker, a CJK UI font, the Bold-text accessibility adjustment) the drawn line is
 * taller than the measured box, the widget scrolls it up to keep the caret in view, and the glyph
 * tops are clipped. A height floor with paddingVertical: 0 and textAlignVertical: 'center' turns
 * what used to be padding into interior room, so a line taller than measured simply sits centred
 * with less air around it. See docs/android-textinput-font-metrics.md.
 *
 * Scaled by the system font size so the slack stays proportional as text scales up. At the default
 * scale of 1 these are exactly the heights the fields already had.
 *
 * The scale is a launch-time snapshot, read once at module load (before the first render, since
 * Dimensions populates itself synchronously from the native constants). Changing the system font
 * size while the app runs recreates the Activity but not the JS context, so these values only
 * refresh on a cold start. Harmless either way: a stale-low floor just means less slack, which is
 * where the app already was, and a stale-high one means a slightly taller field.
 *
 * Clamped because getFontScale() falls back to the pixel DENSITY when the native fontScale is
 * missing, and a density of ~2.75 would silently turn a 40dp field into a 110dp one. At a genuine
 * scale of 2 a 15sp line is ~36dp against an 80dp floor, so the upper bound never bites in real use.
 */
const fontScale = Math.min(Math.max(PixelRatio.getFontScale(), 1), 2);
const INPUT_MIN_HEIGHT = 40 * fontScale;
const COMPACT_INPUT_MIN_HEIGHT = 32 * fontScale;

/**
 * The COMPLETE anti-clipping recipe for a single-line TextInput, as one spreadable token per tier.
 * Spread one of these into every TextInput style — never re-type the three properties by hand.
 *
 * All three parts are load-bearing together, and a field carrying only two of them looks correct on
 * a device whose UI font matches Typeface.DEFAULT. That is not hypothetical: an audit found three
 * fields with the floor and the alignment but no padding reset, which is what made these tokens
 * necessary. Bundling them makes a partial application impossible to write by accident.
 *
 * paddingVertical: 0 is the part that looks redundant and is not. This app runs the New
 * Architecture (app.json newArchEnabled), where AndroidTextInputComponentDescriptor reads the
 * THEME's default TextInput padding and applies it as the component's default — so a field with no
 * padding style keeps Android's theme padding, and the usable interior becomes
 * (minHeight - themePadding) rather than minHeight. Zeroing it is what converts padding into
 * interior room instead of extra height.
 *
 * Horizontal padding is deliberately NOT included: it varies by field (bordered fields want it,
 * fields inside a padded bar want none), and it has nothing to do with vertical clipping.
 */
// `satisfies` rather than `: TextStyle` on purpose. An annotation would widen these to the full
// TextStyle type, and layout.inputField (which spreads INPUT_SLACK) is also applied to the
// muscle-group dropdown Pressable in exercise/new.tsx — a ViewStyle slot that TextStyle is not
// assignable to. `satisfies` type-checks the three properties while keeping the narrow inferred
// shape, so the token stays usable on both a TextInput and a View.
export const INPUT_SLACK = {
  paddingVertical: 0,
  minHeight: INPUT_MIN_HEIGHT,
  textAlignVertical: 'center',
} satisfies TextStyle;

export const COMPACT_INPUT_SLACK = {
  paddingVertical: 0,
  minHeight: COMPACT_INPUT_MIN_HEIGHT,
  textAlignVertical: 'center',
} satisfies TextStyle;
