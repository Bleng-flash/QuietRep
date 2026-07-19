import { MAX_REPS } from '@/constants/inputLimits';
import type { Exercise, MuscleGroup, PlannedSet, Workout } from '@/types';

// A planned set is valid iff both reps are whole numbers in [1, MAX_REPS] and low <= high.
// low === high is allowed — that is a fixed-rep target, not an error.
export function isPlannedSetValid(plannedSet: PlannedSet): boolean {
  const { minReps, maxReps } = plannedSet;
  return (
    Number.isInteger(minReps) &&
    Number.isInteger(maxReps) &&
    minReps >= 1 &&
    maxReps <= MAX_REPS &&
    minReps <= maxReps
  );
}

// Builds the subtitle string shown beneath a workout name — e.g. "3 exercises : Chest | Triceps".
// Shared between WorkoutCard and WorkoutPicker to keep the format consistent.
export function buildWorkoutSubtitle(workout: Workout, allExercises: Exercise[]): string {
  const exerciseCount = workout.exercises.length;
  if (exerciseCount === 0) return 'No exercises yet';

  const muscleGroups = Array.from(
    new Set(
      workout.exercises
        .map(
          (workoutExercise) =>
            allExercises.find((exercise) => exercise.id === workoutExercise.exerciseId)
              ?.muscleGroup,
        )
        .filter((muscleGroup): muscleGroup is MuscleGroup => Boolean(muscleGroup)),
    ),
  );

  return `${exerciseCount} exercise${exerciseCount === 1 ? '' : 's'}${
    muscleGroups.length > 0 ? ' : ' + muscleGroups.join(' | ') : ''
  }`;
}
