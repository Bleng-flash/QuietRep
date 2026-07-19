// Polyfill for crypto.getRandomValues, required by the uuid library to generate
// random IDs. React Native's JS runtime (Hermes/JSC) does not expose the Web
// Crypto API, so this must be imported before anything that transitively imports
// uuid — hence it must be the absolute first import in the app entry point.
import 'react-native-get-random-values';

import { ActiveSessionProvider } from '@/context/ActiveSessionContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { seedDefaultExercises } from '@/storage';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Inner component so it can consume useTheme() — it sits below ThemeProvider. Drives the
// root Stack's base background (repainted in one place on a theme toggle) and flips the
// status-bar contrast to match the active mode.
function ThemedStack() {
  const { mode, colors } = useTheme();
  return (
    <>
      {/* `style` sets the status-bar CONTENT colour (clock/battery/icons), not the theme:
          "light" = light icons for a dark background, "dark" = dark icons for a light one.
          Hence dark mode -> "light" and light mode -> "dark" (reads inverted).
          Not "auto" — that follows the device's system scheme, which would desync from our
          app-controlled toggle. */}
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  // useEffect (not useFocusEffect) — root layouts have no navigation focus lifecycle,
  // and this seed must run exactly once at app startup, not on every focus event.
  useEffect(() => {
    async function runSeed() {
      await seedDefaultExercises();
    }
    runSeed();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ActiveSessionProvider>
          <ThemedStack />
        </ActiveSessionProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
