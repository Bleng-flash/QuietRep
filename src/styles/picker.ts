import { StyleSheet } from 'react-native';
import type { Palette } from './colors';
import { radius } from './radius';
import { spacing } from './spacing';

// Factory: shared chrome for pageSheet picker modals (ExercisePicker, WorkoutPicker, etc.).
// Exposed reactively via useTheme().picker so it rebuilds when the theme toggles.
export const makePicker = (colors: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: spacing.m,
    },
    header: {
      paddingHorizontal: spacing.m,
      marginBottom: spacing.m,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s,
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.m,
      paddingHorizontal: spacing.m,
      paddingVertical: spacing.s + 2,
      marginHorizontal: spacing.m,
      marginBottom: spacing.s,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
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
