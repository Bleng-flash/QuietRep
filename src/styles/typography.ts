import { StyleSheet } from 'react-native';
import type { Palette } from './colors';

// Factory: builds the typography StyleSheet for a given palette. Exposed reactively via
// useTheme().typography so text colours rebuild when the theme toggles.
export const makeTypography = (colors: Palette) =>
  StyleSheet.create({
    // App wordmark — larger and heavier than heading, for the QuietRep branding on the Home tab.
    appTitle: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: 0.3,
    },
    heading: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: 0.3,
    },
    subheading: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
    },
    body: {
      fontSize: 15,
      fontWeight: '400',
      color: colors.text,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    caption: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textSubtle,
    },
    // Inline action button labels — used for Save, Create new, and similar primary CTAs
    actionPrimary: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    actionSecondary: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.primaryMuted,
    },
    // Inline action button labels — used for Cancel and other low-emphasis actions
    actionSubtle: {
      fontSize: 15,
      color: colors.textSubtle,
    },
    // Inline action button labels — used for Delete and other destructive actions
    actionDanger: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.error,
    },
  });

// The resolved typography stylesheet for one palette — the shape useTheme().typography returns.
export type Typography = ReturnType<typeof makeTypography>;
