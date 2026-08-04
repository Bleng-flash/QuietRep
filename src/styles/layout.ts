import { StyleSheet } from 'react-native';
import type { Palette } from './colors';
import { radius } from './radius';
import { INPUT_MIN_HEIGHT, spacing } from './spacing';

// Factory: builds the layout StyleSheet for a given palette. Called by ThemeProvider
// and exposed reactively via useTheme().layout, so styles rebuild when the theme toggles.
export const makeLayout = (colors: Palette) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    screenPadded: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.m,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.l,
      padding: spacing.m,
      borderWidth: 2,
      borderColor: colors.border,
    },
    // Top bar shared by editor screens (WorkoutEditor, and future exercise editors)
    topBar: {
      paddingHorizontal: spacing.m,
      paddingVertical: spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    // 1px horizontal rule — callers add their own margin/color overrides as needed
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
    // Dashed destructive action button used for delete operations in editors.
    // Does not include margin — callers apply marginTop/marginHorizontal as needed.
    dangerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.s,
      borderWidth: 1,
      borderColor: colors.error,
      borderStyle: 'dashed',
      borderRadius: radius.l,
      paddingVertical: spacing.m,
      backgroundColor: colors.errorSubtle,
    },
    // Primary dashed additive-action button (parallels dangerButton in primary colour).
    // Does not include margin or flex — callers add those. Compact callers may override
    // gap / borderRadius / paddingVertical for smaller, nested contexts.
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.s,
      borderWidth: 1,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      borderRadius: radius.l,
      paddingVertical: spacing.m,
      backgroundColor: colors.primarySubtle,
    },
    // Base surface style for TextInput fields. Compose with typography.body for the text style.
    // Callers may add overrides (e.g. width, padding, textAlign) for specific input shapes.
    //
    // The height comes from INPUT_MIN_HEIGHT rather than vertical padding, and the line is centred
    // inside it: that leaves the whole box as slack for a drawn line taller than RN measured, which
    // is what stops the glyph tops being clipped on devices with a substituted UI font. Same total
    // height as the padding it replaced — see the INPUT_MIN_HEIGHT comment in spacing.ts.
    inputField: {
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.m,
      paddingHorizontal: spacing.m,
      paddingVertical: 0,
      minHeight: INPUT_MIN_HEIGHT,
      textAlignVertical: 'center',
    },
    pressedButton: {
      opacity: 0.6,
    },
    pressedCard: {
      opacity: 0.75,
    },
    // Dimming for a non-interactive control or row. Unlike the pressed states above, this is
    // one value for any element, so it is not element-suffixed. Compose into a style array.
    disabled: {
      opacity: 0.4,
    },
  });

// The resolved layout stylesheet for one palette — the shape useTheme().layout returns.
export type Layout = ReturnType<typeof makeLayout>;
