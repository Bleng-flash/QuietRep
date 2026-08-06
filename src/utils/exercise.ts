import { DEFAULT_EXERCISES } from '@/constants/defaultExercises';
import { MUSCLE_GROUPS } from '@/constants/muscleGroups';
import type { Exercise, MuscleGroup } from '@/types';

// Canonical position of each muscle group — the order sections appear in the library screen
// and the order the groups run in the flat picker.
const MUSCLE_GROUP_RANK = new Map<MuscleGroup, number>(
  MUSCLE_GROUPS.map((muscleGroup, index) => [muscleGroup, index]),
);

// Position of each default exercise in the seed constant. Keyed by lowercased name because
// seeded ids are generated per device — the name is the only identity a stored default shares
// with the constant, and it is already the app's uniqueness key.
const DEFAULT_EXERCISE_RANK = new Map<string, number>(
  DEFAULT_EXERCISES.map((exercise, index) => [exercise.name.toLowerCase(), index]),
);

interface RankedExercise {
  exercise: Exercise;
  muscleGroupRank: number;
  originRank: number; // 0 = seeded default, 1 = user-created
  withinOriginRank: number;
}

/** Orders exercises for display: grouped by muscle group in MUSCLE_GROUPS order, and within a
 *  group the seeded defaults in DEFAULT_EXERCISES order followed by user-created ones in
 *  creation order. Takes the two stored arrays separately because a user exercise's creation
 *  order is its index in the user array — merging first would lose it. */
export function orderExercisesForDisplay(
  defaultExercises: Exercise[],
  userExercises: Exercise[],
): Exercise[] {
  const rankedExercises: RankedExercise[] = [
    ...defaultExercises.map((exercise, storedIndex) => ({
      exercise,
      muscleGroupRank: MUSCLE_GROUP_RANK.get(exercise.muscleGroup) ?? MUSCLE_GROUPS.length,
      originRank: 0,
      // A stored default the constant no longer lists (dropped in a later release) keeps its
      // stored relative position, after every default still listed.
      withinOriginRank:
        DEFAULT_EXERCISE_RANK.get(exercise.name.toLowerCase()) ??
        DEFAULT_EXERCISES.length + storedIndex,
    })),
    ...userExercises.map((exercise, creationIndex) => ({
      exercise,
      muscleGroupRank: MUSCLE_GROUP_RANK.get(exercise.muscleGroup) ?? MUSCLE_GROUPS.length,
      originRank: 1,
      // userExercises is append-only (addExercise pushes, deleteExercise filters), so the
      // array index is creation order.
      withinOriginRank: creationIndex,
    })),
  ];

  // Sorting a locally built array — neither input array is mutated.
  rankedExercises.sort(
    (first, second) =>
      first.muscleGroupRank - second.muscleGroupRank ||
      first.originRank - second.originRank ||
      first.withinOriginRank - second.withinOriginRank,
  );

  return rankedExercises.map((rankedExercise) => rankedExercise.exercise);
}
