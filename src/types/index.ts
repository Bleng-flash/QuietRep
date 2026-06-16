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
export interface SetScheme {
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
  sets: SetScheme[];
}

/** WorkoutExercise with its Exercise resolved — used where both are needed together.
 *  exercise is | undefined because a user can delete an exercise from the catalog
 *  after it was added to a workout, leaving a dangling exerciseId FK. */
export type ResolvedWorkoutExercise = WorkoutExercise & { exercise: Exercise | undefined };

/** Editor view models — frontend only, no DB counterpart (like ResolvedWorkoutExercise above).
 *  localKey is a stable React list key for set rows in the workout editor; it is generated in
 *  the editor and stripped before persisting, so it never reaches storage. Keying SetRow by it
 *  (instead of by array index) keeps each row's local text buffer bound to the right set when
 *  sets are removed or reordered. */
export type EditableSet = SetScheme & { localKey: string };
export type ResolvedEditableWorkoutExercise = Omit<ResolvedWorkoutExercise, 'sets'> & {
  sets: EditableSet[];
};

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
