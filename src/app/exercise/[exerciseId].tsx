import ExerciseHistory from '@/components/history/byExercise/ExerciseHistory';
import { useLocalSearchParams } from 'expo-router';

// Read-only progression history for one exercise. Root-stack route so it's reachable from
// History's "By exercise" list now and Home/Plan later without a cross-navigator push.
// Coexists with the static /exercise/new route — Expo Router resolves static segments first.
// Thin screen: params in, fat component renders.
export default function ExerciseHistoryScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  return <ExerciseHistory exerciseId={exerciseId} />;
}
