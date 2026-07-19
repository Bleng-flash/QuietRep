import { MAX_REPS, MAX_WEIGHT } from '@/constants/inputLimits';
import type {
  EditableLoggedSet,
  EditableSessionExercise,
  LoggedSet,
  PlannedSet,
  SessionExercise,
  WorkoutExercise,
  WorkoutSession,
} from '@/types';
import { v4 as uuid } from 'uuid';

// A logged set is valid iff reps is a whole number in [1, MAX_REPS] and weight is a non-negative
// number in [0, MAX_WEIGHT]. Weight 0 is allowed — bodyweight exercises (pull-ups, dips)
// legitimately carry no external load; only reps must be at least 1. Mirrors isPlannedSetValid.
// The single source of truth for both the finish-time block and the per-row error highlight.
export function isLoggedSetValid(loggedSet: LoggedSet): boolean {
  const { weight, reps } = loggedSet;
  return (
    Number.isInteger(reps) &&
    reps >= 1 &&
    reps <= MAX_REPS &&
    Number.isFinite(weight) &&
    weight >= 0 &&
    weight <= MAX_WEIGHT
  );
}

/** Creates a blank EditableLoggedSet seeded from a PlannedSet's rep range.
 *  weight and reps start at 0; the planned range is carried as faint target hints in the session UI. */
function plannedSetToEditableLoggedSet(plannedSet: PlannedSet): EditableLoggedSet {
  return {
    weight: 0,
    reps: 0,
    localKey: uuid(),
    targetMinReps: plannedSet.minReps > 0 ? plannedSet.minReps : undefined,
    targetMaxReps: plannedSet.maxReps > 0 ? plannedSet.maxReps : undefined,
  };
}

/** Converts a planned WorkoutExercise list into editable session exercises.
 *  Each PlannedSet becomes a blank EditableLoggedSet carrying the planned rep range as target hints. */
export function seedSessionExercises(
  workoutExercises: WorkoutExercise[],
): EditableSessionExercise[] {
  return workoutExercises.map((workoutExercise) => ({
    exerciseId: workoutExercise.exerciseId,
    sets: workoutExercise.sets.map(plannedSetToEditableLoggedSet),
  }));
}

/** Strips view-model fields (localKey, targetMinReps, targetMaxReps) from an EditableLoggedSet,
 *  returning the canonical LoggedSet shape ready for storage. */
function editableLoggedSetToLoggedSet({ weight, reps }: EditableLoggedSet): LoggedSet {
  return { weight, reps };
}

/** Strips view-model fields from editable session exercises,
 *  returning the canonical SessionExercise shape ready for storage. */
export function stripToCanonicalExercises(
  editableExercises: EditableSessionExercise[],
): SessionExercise[] {
  return editableExercises.map((exercise) => ({
    exerciseId: exercise.exerciseId,
    sets: exercise.sets.map(editableLoggedSetToLoggedSet),
  }));
}

/** Re-attaches fresh localKeys to persisted session exercises so they can be used as editable
 *  view models. Called when hydrating from storage after an app restart mid-session.
 *  No targetMinReps/Max — those are plan-seeding hints and are never persisted to storage. */
export function hydrateSessionExercises(exercises: SessionExercise[]): EditableSessionExercise[] {
  return exercises.map((sessionExercise) => ({
    exerciseId: sessionExercise.exerciseId,
    sets: sessionExercise.sets.map((loggedSet) => ({ ...loggedSet, localKey: uuid() })),
  }));
}

/** Assembles a canonical WorkoutSession from the context's working state for storage writes.
 *  finishedAt is always null here — storage's finishSession() stamps it on the Finish action. */
export function toCanonicalSession(
  id: string,
  name: string,
  startedAt: string,
  editableExercises: EditableSessionExercise[],
): WorkoutSession {
  return {
    id,
    name,
    startedAt,
    finishedAt: null,
    exercises: stripToCanonicalExercises(editableExercises),
  };
}
