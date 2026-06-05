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

/** An interface describing one set */
export interface SetScheme {
  reps: number;
  load: number;
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
