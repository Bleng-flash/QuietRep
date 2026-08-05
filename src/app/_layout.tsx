// Polyfill for crypto.getRandomValues, required by the uuid library to generate
// random IDs. React Native's JS runtime (Hermes/JSC) does not expose the Web
// Crypto API, so this must be imported before anything that transitively imports
// uuid — hence it must be the absolute first import in the app entry point.
import 'react-native-get-random-values';

import SessionNotificationBridge from '@/components/session/SessionNotificationBridge';
import { SplashGate } from '@/components/shared/SplashGate';
import { ActiveSessionProvider } from '@/context/ActiveSessionContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { UnitProvider } from '@/context/UnitContext';
import { seedDefaultExercises } from '@/storage';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

// Module scope, not an effect: the splash auto-hides as soon as the first frame renders, which
// is earlier than any effect can run. SplashGate hides it once the providers have hydrated.
//
// This only takes effect in a PRODUCTION build, where the JS bundle is embedded and runs before
// the splash would auto-hide. In a dev build expo-dev-client fetches the bundle from Metro first,
// so the splash is already gone by the time this line executes and the call is a no-op — which
// is why SplashGate also paints its own JS overlay rather than relying on this alone.
SplashScreen.preventAutoHideAsync().catch(() => {});

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

  // Every component below mounts once and stays mounted for the rest of the JS runtime.
  // Backgrounding does NOT unmount. 
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* KeyboardProvider (react-native-keyboard-controller) sits above the whole tree so every
          screen's KeyboardAvoidingView can read the reactive keyboard height. This is what makes
          keyboard avoidance work under Android edge-to-edge, where the OS no longer resizes the
          window for the IME.

          THIS IS THE ONLY ONE. Never nest a second KeyboardProvider, including inside a <Modal>.
          Its context reaches modal content fine (a Modal's children are React descendants), and
          the library bridges the Dialog's own native window itself via ModalAttachedWatcher.
          A second provider registers a second watcher on the global event dispatcher; both react
          to the same modal show and both call setOnDismissListener, which is a setter, so one
          overwrites the other. Only one resume fires and the loser's callback stays suspended for
          the rest of the process — killing keyboard tracking app-wide. See PickerModal. */}
      <KeyboardProvider>
        <ThemeProvider>
          {/* UnitProvider sits above ActiveSessionProvider: the session provider consumes
              useUnit() to stamp each new session with the unit it is logged in. */}
          <UnitProvider>
            <ActiveSessionProvider>
              {/* Renders nothing — an AppState controller that posts the ongoing-session
                  notification when the app is backgrounded mid-workout and clears it on return.
                  A plain context consumer, so it is mounted here rather than inside the provider
                  (which would make ActiveSessionContext import a component that imports it back). */}
              <SessionNotificationBridge />
              {/* Innermost, so it can read every provider's hasHydrated flag. Renders its
                  children unconditionally and covers them with an overlay until hydration
                  completes — so the app mounts on schedule but never paints in the wrong theme. */}
              <SplashGate>
                <ThemedStack />
              </SplashGate>
            </ActiveSessionProvider>
          </UnitProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
