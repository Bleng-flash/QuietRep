/** Constraint on what strings are valid muscle group values */
export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Forearms'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Adductors'
  | 'Calves'
  | 'Core'
  | 'Other';

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** A planned set: a rep range only. Load is intentionally absent — it is a runtime value
 *  (what you actually lift), recorded on the live session, not something planned ahead.
 *  A fixed target is expressed as minReps === maxReps. */
export interface PlannedSet {
  minReps: number;
  maxReps: number;
}

/** An interface describing one exercise */
export interface Exercise {
  id: string;
  name: string; // must be unique across all exercises — enforced in addExercise
  muscleGroup: MuscleGroup;
  isDefault: boolean; // whether this exercise is from the seed list or added by user
}

/** Describes one exercise's slot within a workout */
export interface WorkoutExercise {
  exerciseId: string; // match Exercise.id
  sets: PlannedSet[];
}

// -------- Editor view models: frontend only, no DB counterpart --------
/** localKey is a stable React list key for set rows in the workout editor; it is generated in
 *  the editor and stripped before persisting, so it never reaches storage.
 *  Keying SetRow by it keeps each row's local text buffer bound to the right set when
 *  sets are removed or reordered. */
export type EditablePlannedSet = PlannedSet & { localKey: string };

export type EditableWorkoutExercise = Omit<WorkoutExercise, 'sets'> & {
  sets: EditablePlannedSet[];
};

/** exercise is | undefined because a user can delete an exercise from the catalog
 *  after it was added to a workout, leaving a dangling exerciseId FK. */
export type ResolvedEditableWorkoutExercise = EditableWorkoutExercise & {
  exercise: Exercise | undefined;
};

// ------------------------------------------------------------------------

/** A named (ordered) collection of WorkoutExercise entries */
export interface Workout {
  id: string;
  name: string;
  exercises: WorkoutExercise[]; // ordered array => exercise order within workout
  isStandalone: boolean; // true = created in Workouts section and shown there; false = embedded inside a split
}

/** A named weekly split */
export interface Split {
  id: string;
  name: string;
  days: Record<DayKey, string[]>;
  // days: an object where keys are of type DayKey, and values are array of workoutId string to allow for
  // 0 to n workouts per day (empty array means rest day)
}

/** Runtime record of one performed set — weight (kg) + actual reps.
 *  Load is intentionally absent from plan types (PlannedSet/WorkoutExercise); it belongs only here. */
export interface LoggedSet {
  weight: number; // in kg - units preference deferred
  reps: number;
}

/** One exercise slot within a live workout session */
export interface SessionExercise {
  exerciseId: string; // matches Exercise.id
  sets: LoggedSet[];
}

/** A recorded workout session — in-progress when finishedAt is null, completed otherwise */
export interface WorkoutSession {
  id: string;
  name: string;
  startedAt: string; // ISO 8601 timestamp
  finishedAt: string | null; // null while live; stamped on Finish
  exercises: SessionExercise[];
}

// -------- Session view models: frontend only, no DB counterpart --------
// targetMinReps/targetMaxReps: planned rep range hint, shown faintly in-session; never persisted to history
export type EditableLoggedSet = LoggedSet & {
  localKey: string;
  targetMinReps?: number;
  targetMaxReps?: number;
};

export type EditableSessionExercise = Omit<SessionExercise, 'sets'> & { sets: EditableLoggedSet[] };

export type ResolvedEditableSessionExercise = EditableSessionExercise & {
  exercise: Exercise | undefined;
};
// ------------------------------------------------------------------------

// -------- History view models: frontend only, no DB counterpart --------
/** Represents one row in the History tab's "By exercise" list: an exercise that appears in at least one
 *  past session, pre-joined with its catalog name/muscleGroup and a couple of summary stats. */
export interface ExerciseHistorySummary {
  exerciseId: string; // matches Exercise.id
  name: string; // resolved from the catalog; 'Unknown exercise' for a dangling FK
  muscleGroup: MuscleGroup;
  sessionCount: number; // how many past sessions included this exercise
  lastPerformedAt: string; // ISO 8601 — most recent session's startedAt
}

/** One past session's worth of logged sets for a single exercise, used by the exercise-history
 *  detail screen to show progression over time (one card per session). */
export interface ExercisePerformance {
  sessionId: string;
  sessionName: string;
  performedAt: string; // ISO 8601 — the session's startedAt
  sets: LoggedSet[];
}
// ------------------------------------------------------------------------
