import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { spacing } from './spacing';

// Shared chrome for pageSheet picker modals (ExercisePicker, WorkoutPicker, etc.)
export const picker = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
    paddingTop: spacing.m,
  },
  header: {
    paddingHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    backgroundColor: colors.dark.inputBackground,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s + 2,
    marginHorizontal: spacing.m,
    marginBottom: spacing.s,
  },
  searchInput: {
    flex: 1,
    color: colors.dark.text,
    fontSize: 15,
  },
  // Footer row in the list for creating a new item
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m + spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
    marginTop: spacing.s,
  },
  createLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.dark.primary,
  },
});
