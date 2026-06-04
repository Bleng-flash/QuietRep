// Polyfill for crypto.getRandomValues, required by the uuid library to generate
// random IDs. React Native's JS runtime (Hermes/JSC) does not expose the Web
// Crypto API, so this must be imported before anything that transitively imports
// uuid — hence it must be the absolute first import in the app entry point.
import 'react-native-get-random-values';

import { seedDefaultExercises } from '@/storage';
import { Stack } from 'expo-router';
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    async function runSeed() {
      await seedDefaultExercises();
    }
    runSeed();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
