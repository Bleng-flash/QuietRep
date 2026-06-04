import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { spacing } from './spacing';

export const layout = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  screenPadded: {
    flex: 1,
    backgroundColor: colors.dark.background,
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
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: spacing.m,
    borderWidth: 2,
    borderColor: colors.dark.border,
  },
  // Top bar shared by editor screens (WorkoutEditor, and future exercise editors)
  topBar: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.borderSubtle,
  },
  // 1px horizontal rule — callers add their own margin/color overrides as needed
  divider: {
    height: 1,
    backgroundColor: colors.dark.border,
  },
  // Dashed destructive action button used for delete operations in editors.
  // Does not include margin — callers apply marginTop/marginHorizontal as needed.
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    borderWidth: 1,
    borderColor: colors.dark.error,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: spacing.m,
    backgroundColor: colors.dark.errorSubtle,
  },
  pressedButton: {
    opacity: 0.6,
  },
  pressedCard: {
    opacity: 0.75,
  },
});
