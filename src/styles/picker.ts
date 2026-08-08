import { StyleSheet } from 'react-native';
import type { Palette } from './colors';
import { radius } from './radius';
import { INPUT_SLACK, spacing } from './spacing';

// Factory: shared chrome for pageSheet picker modals (ExercisePicker, WorkoutPicker, etc.).
// Exposed reactively via useTheme().picker so it rebuilds when the theme toggles.
export const makePicker = (colors: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      // No paddingTop here: the picker Modal is a full-screen edge-to-edge window, so its top
      // gap is insets.top + spacing.s applied inline in PickerModal. A safe-area inset is a
      // runtime value and cannot live in a StyleSheet.create factory.
    },
    header: {
      paddingHorizontal: spacing.m,
      marginBottom: spacing.m,
    },
    // No vertical padding here: the bar's height comes from the input's own INPUT_SLACK floor,
    // so the field keeps the slack that stops its text being clipped (see spacing.ts).
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s,
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.m,
      paddingHorizontal: spacing.m,
      paddingVertical: 0,
      marginHorizontal: spacing.m,
      marginBottom: spacing.s,
    },
    // No horizontal padding of its own — searchBar above owns that. The vertical slack still
    // belongs on the field: the EditText's own box is what clips, and padding on the wrapper is
    // not slack for the input inside it.
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      ...INPUT_SLACK,
    },
    // Shared row chrome for picker list items — content layout is supplied by the caller
    item: {
      paddingHorizontal: spacing.m,
      paddingVertical: spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    // Footer row in the list for creating a new item
    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s,
      paddingHorizontal: spacing.m,
      paddingVertical: spacing.m + spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: spacing.s,
    },
    createLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.primary,
    },
  });

// The resolved picker stylesheet for one palette — the shape useTheme().picker returns.
export type Picker = ReturnType<typeof makePicker>;
