import type { Exercise, MuscleGroup, Workout } from '@/types';

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
