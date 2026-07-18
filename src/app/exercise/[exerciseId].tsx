import ExerciseHistory from '@/components/history/byExercise/ExerciseHistory';
import { useLocalSearchParams } from 'expo-router';

// Read-only progression history for one exercise. Reached only from History's "By exercise"
// lens, but kept on the ROOT stack (not tab-local) to stay symmetric with its twin
// session/[sessionId] (session-detail), which is root-pinned because Home also opens it.
// A deliberate exception to "one-tab reach -> tab-local": the two History-lens detail screens
// live in one navigator. Coexists with the static /exercise/new route — Expo Router resolves
// static segments first. Thin screen: params in, fat component renders.
export default function ExerciseHistoryScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  return <ExerciseHistory exerciseId={exerciseId} />;
}
