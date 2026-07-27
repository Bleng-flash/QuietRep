import { useActiveSession } from '@/context/ActiveSessionContext';
import { useTheme } from '@/context/ThemeContext';
import { useUnit } from '@/context/UnitContext';
import { palettes } from '@/styles';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';

/**
 * Covers the app until every provider has read its stored value, so the first frame the user
 * sees is already in the correct theme.
 *
 * Without this, each provider renders against its default and then snaps once AsyncStorage
 * returns: a Light-mode user sees a flash of dark theme on every cold launch (ThemeProvider
 * defaults to 'dark'), plus smaller pops as the unit resolves and the resume banner appears.
 *
 * Two mechanisms, because one is not enough:
 *
 * 1. The native splash is held (preventAutoHideAsync in _layout.tsx) and hidden here. This works
 *    in a production build, where the JS bundle is embedded and starts executing before the
 *    splash would auto-hide.
 * 2. A JS overlay (this component), because mechanism 1 CANNOT work in a dev build: expo-dev-client fetches the
 *    bundle from Metro over the network first ("Loading from <ip>"), and the native splash is
 *    long gone by the time this module is even evaluated — preventAutoHideAsync arrives too late
 *    to prevent anything. The overlay is plain React, so it behaves identically in both.
 *
 * `children` still renders throughout: the tree mounts, lays out and hydrates *behind* the
 * overlay rather than being delayed by it, so the navigator is ready the instant the cover lifts.
 */
export function SplashGate({ children }: { children: ReactNode }) {
  const { hasHydrated: hasThemeHydrated } = useTheme();
  const { hasHydrated: hasUnitHydrated } = useUnit();
  const { hasHydrated: hasSessionHydrated } = useActiveSession();

  // The one place in the app that must NOT read colours from useTheme(). That hook can only
  // report the DEFAULT mode until ThemeProvider hydrates — which is precisely the wrong-theme
  // frame this component exists to hide. So the cover follows the *device* scheme instead, the
  // same signal the native splash uses, making the handoff between the two invisible.
  const deviceColorScheme = useColorScheme();
  const coverPalette = deviceColorScheme === 'light' ? palettes.light : palettes.dark;

  const isReady = hasThemeHydrated && hasUnitHydrated && hasSessionHydrated;

  useEffect(() => {
    if (!isReady) return;
    // Each provider sets its flag in a `finally`, so a failed storage read still lands here and
    // the app is never left under the cover permanently. Fire-and-forget; the catch swallows the
    // benign "already hidden" rejection, which is the normal case in a dev build.
    SplashScreen.hideAsync().catch(() => {});
  }, [isReady]);

  return (
    <View style={styles.root}>
      {children}
      {/* Painted last, so it sits above the app — React Native has no default z-index, later
          siblings simply paint over earlier ones. React commits the correct theme and the removal
          of this cover in the same pass, so there is no frame where one has landed without the
          other. The QuietRep mark belongs here once the brand assets exist.

          Deliberately NOT pointerEvents="none": the app is fully mounted underneath, so letting
          touches through would let the user press a tab-bar button they cannot see. The default
          makes this opaque View the hit target, harmlessly swallowing taps until it lifts. */}
      {!isReady && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: coverPalette.background }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
