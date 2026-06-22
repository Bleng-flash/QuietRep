// Polyfill for crypto.getRandomValues, required by the uuid library to generate
// random IDs. React Native's JS runtime (Hermes/JSC) does not expose the Web
// Crypto API, so this must be imported before anything that transitively imports
// uuid — hence it must be the absolute first import in the app entry point.
import 'react-native-get-random-values';

import { seedDefaultExercises } from '@/storage';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
