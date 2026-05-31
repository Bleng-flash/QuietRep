import "react-native-get-random-values"; // must be the absolute first import

import { DEFAULT_EXERCISES } from "@/constants/defaultExercises";
import { addExercise, getExercises } from "@/storage";
import { Exercise } from "@/types";
import { Stack } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    async function seedDefaultExercises() {
      const existingExercises: Exercise[] = await getExercises();
      if (existingExercises.length === 0) {
        for (const exercise of DEFAULT_EXERCISES) {
          await addExercise(exercise);
        }
      }
    }
    seedDefaultExercises();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
