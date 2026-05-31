import { Exercise } from "@/types";

/** Omit is a TypeScript utility type that takes an existing interface and produces a new type with one or more fields removed.
 *  So Omit<Exercise, "id"> means the shape of Exercise but without id field */
export const DEFAULT_EXERCISES: Omit<Exercise, "id">[] = [
  // -------- Chest --------
  { name: "Barbell Bench Press", muscleGroup: "Chest", isDefault: true },
  {
    name: "Incline Dumbbell Bench Press",
    muscleGroup: "Chest",
    isDefault: true,
  },
  { name: "Cable Fly", muscleGroup: "Chest", isDefault: true },
  { name: "Push Up", muscleGroup: "Chest", isDefault: true },

  // -------- Back --------
  { name: "Deadlift", muscleGroup: "Back", isDefault: true },
  { name: "Barbell Row", muscleGroup: "Back", isDefault: true },
  { name: "Lat Pulldown", muscleGroup: "Back", isDefault: true },
  { name: "Seated Cable Row", muscleGroup: "Back", isDefault: true },
  { name: "Pull Up", muscleGroup: "Back", isDefault: true },

  // -------- Shoulders --------
  { name: "Overhead Press", muscleGroup: "Shoulders", isDefault: true },
  { name: "Lateral Raise", muscleGroup: "Shoulders", isDefault: true },
  { name: "Face Pull", muscleGroup: "Shoulders", isDefault: true },

  // -------- Biceps --------
  { name: "Barbell Curl", muscleGroup: "Biceps", isDefault: true },
  { name: "Incline Dumbbell Curl", muscleGroup: "Biceps", isDefault: true },

  // -------- Triceps --------
  { name: "Tricep Pushdown", muscleGroup: "Triceps", isDefault: true },
  { name: "Skull Crusher", muscleGroup: "Triceps", isDefault: true },

  // -------- Forearms --------

  // -------- Quads --------
  { name: "Squat", muscleGroup: "Quads", isDefault: true },
  { name: "Leg Press", muscleGroup: "Quads", isDefault: true },

  // -------- Hamstrings --------
  { name: "Romanian Deadlift", muscleGroup: "Hamstrings", isDefault: true },
  { name: "Seated Leg Curl", muscleGroup: "Hamstrings", isDefault: true },

  // -------- Glutes --------

  // -------- Calves --------
  { name: "Standing Calf Raise", muscleGroup: "Calves", isDefault: true },

  //  -------- Core --------
  { name: "Plank", muscleGroup: "Core", isDefault: true },
  { name: "Cable Crunch", muscleGroup: "Core", isDefault: true },
  { name: "Hanging Leg Raise", muscleGroup: "Core", isDefault: true },
];
