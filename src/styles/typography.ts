import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const typography = StyleSheet.create({
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.dark.text,
    letterSpacing: 0.3,
  },
  subheading: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.dark.text,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.dark.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.dark.text,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.dark.textSubtle,
  },
  // Inline action button labels — used for Save, Create new, and similar primary CTAs
  actionPrimary: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.dark.primary,
  },
  actionSecondary: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.dark.primaryMuted,
  },
  // Inline action button labels — used for Cancel and other low-emphasis actions
  actionSubtle: {
    fontSize: 15,
    color: colors.dark.textSubtle,
  },
  // Inline action button labels — used for Delete and other destructive actions
  actionDanger: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.dark.error,
  },
});
