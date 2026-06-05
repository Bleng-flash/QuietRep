import { Exercise } from '@/types';

/* Omit is a TypeScript utility type that takes an existing interface and produces a new type with one or more fields removed.
  So Omit<Exercise, "id"> means the shape of Exercise but without id field */
export const DEFAULT_EXERCISES: Omit<Exercise, 'id'>[] = [
  // -------- Chest --------
  { name: 'Flat Barbell Bench Press', muscleGroup: 'Chest', isDefault: true },
  { name: 'Incline Barbell Bench Press', muscleGroup: 'Chest', isDefault: true },
  { name: 'Flat Dumbbell Bench Press', muscleGroup: 'Chest', isDefault: true },
  { name: 'Incline Dumbbell Bench Press', muscleGroup: 'Chest', isDefault: true },
  { name: 'Flat Smith Bench Press', muscleGroup: 'Chest', isDefault: true },
  { name: 'Incline Smith Bench Press', muscleGroup: 'Chest', isDefault: true },
  { name: 'Dumbbell Fly', muscleGroup: 'Chest', isDefault: true },
  { name: 'Cable Fly', muscleGroup: 'Chest', isDefault: true },
  { name: 'Low Cable Fly', muscleGroup: 'Chest', isDefault: true },
  { name: 'High Cable Fly', muscleGroup: 'Chest', isDefault: true },
  { name: 'Push Up', muscleGroup: 'Chest', isDefault: true },
  { name: 'Chest Dip', muscleGroup: 'Chest', isDefault: true },
  { name: 'Pec Deck', muscleGroup: 'Chest', isDefault: true },
  { name: 'Chest Press Machine', muscleGroup: 'Chest', isDefault: true },

  // -------- Back --------
  { name: 'Barbell Deadlift', muscleGroup: 'Back', isDefault: true },
  { name: 'Barbell Row', muscleGroup: 'Back', isDefault: true },
  { name: 'Pendlay Row', muscleGroup: 'Back', isDefault: true },
  { name: 'Dumbbell Row', muscleGroup: 'Back', isDefault: true },
  { name: 'Seated Cable Row', muscleGroup: 'Back', isDefault: true },
  { name: 'Wide Grip Seated Cable Row', muscleGroup: 'Back', isDefault: true },
  { name: 'Close Grip Seated Cable Row', muscleGroup: 'Back', isDefault: true },
  { name: 'Lat Pulldown', muscleGroup: 'Back', isDefault: true },
  { name: 'Wide Grip Lat Pulldown', muscleGroup: 'Back', isDefault: true },
  { name: 'Close Grip Lat Pulldown', muscleGroup: 'Back', isDefault: true },
  { name: 'Pull Up', muscleGroup: 'Back', isDefault: true },
  { name: 'Chin Up', muscleGroup: 'Back', isDefault: true },
  { name: 'Neutral Grip Pull Up', muscleGroup: 'Back', isDefault: true },
  { name: 'Cable Pullover', muscleGroup: 'Back', isDefault: true },
  { name: 'T-Bar Row', muscleGroup: 'Back', isDefault: true },
  { name: 'Back Extension', muscleGroup: 'Back', isDefault: true },

  // -------- Shoulders --------
  { name: 'Military Press', muscleGroup: 'Shoulders', isDefault: true },
  { name: 'Seated Dumbbell Overhead Press', muscleGroup: 'Shoulders', isDefault: true },
  { name: 'Dumbbell Lateral Raise', muscleGroup: 'Shoulders', isDefault: true },
  { name: 'Cable Lateral Raise', muscleGroup: 'Shoulders', isDefault: true },
  { name: 'Dumbbell Front Raise', muscleGroup: 'Shoulders', isDefault: true },
  { name: 'Cable Front Raise', muscleGroup: 'Shoulders', isDefault: true },
  { name: 'Face Pull', muscleGroup: 'Shoulders', isDefault: true },
  { name: 'Rear Delt Cable Fly', muscleGroup: 'Shoulders', isDefault: true },
  { name: 'Reverse Pec Deck', muscleGroup: 'Shoulders', isDefault: true },
  { name: 'Shoulder Press Machine', muscleGroup: 'Shoulders', isDefault: true },

  // -------- Biceps --------
  { name: 'Barbell Curl', muscleGroup: 'Biceps', isDefault: true },
  { name: 'EZ Bar Curl', muscleGroup: 'Biceps', isDefault: true },
  { name: 'Dumbbell Curl', muscleGroup: 'Biceps', isDefault: true },
  { name: 'Hammer Curl', muscleGroup: 'Biceps', isDefault: true },
  { name: 'Incline Dumbbell Curl', muscleGroup: 'Biceps', isDefault: true },
  { name: 'Preacher Curl', muscleGroup: 'Biceps', isDefault: true },
  { name: 'Preacher Curl Machine', muscleGroup: 'Biceps', isDefault: true },
  { name: 'Cable Curl', muscleGroup: 'Biceps', isDefault: true },
  { name: 'Cable Hammer Curl', muscleGroup: 'Biceps', isDefault: true },
  { name: 'Concentration Curl', muscleGroup: 'Biceps', isDefault: true },
  { name: 'Spider Curl', muscleGroup: 'Biceps', isDefault: true },

  // -------- Triceps --------
  { name: 'Barbell JM Press', muscleGroup: 'Triceps', isDefault: true },
  { name: 'Smith JM Press', muscleGroup: 'Triceps', isDefault: true },
  { name: 'Tricep Bar Pushdown', muscleGroup: 'Triceps', isDefault: true },
  { name: 'Tricep Rope Pushdown', muscleGroup: 'Triceps', isDefault: true },
  { name: 'Dumbbell Overhead Tricep Extension', muscleGroup: 'Triceps', isDefault: true },
  { name: 'Cable Overhead Tricep Extension', muscleGroup: 'Triceps', isDefault: true },
  { name: 'EZ-bar Skull Crusher', muscleGroup: 'Triceps', isDefault: true },
  { name: 'Tricep Dip', muscleGroup: 'Triceps', isDefault: true },
  { name: 'Diamond Push Up', muscleGroup: 'Triceps', isDefault: true },

  // -------- Forearms --------
  { name: 'Dumbbell Wrist Curl', muscleGroup: 'Forearms', isDefault: true },
  { name: 'Dumbbell Wrist Extension', muscleGroup: 'Forearms', isDefault: true },
  { name: 'Reverse Dumbbell Curl', muscleGroup: 'Forearms', isDefault: true },
  { name: 'Cable Wrist Curl', muscleGroup: 'Forearms', isDefault: true },

  // -------- Quads --------
  { name: 'Barbell Squat', muscleGroup: 'Quads', isDefault: true },
  { name: 'Smith Squat', muscleGroup: 'Quads', isDefault: true },
  { name: 'Barbell Front Squat', muscleGroup: 'Quads', isDefault: true },
  { name: 'Smith Front Squat', muscleGroup: 'Quads', isDefault: true },
  { name: 'Hack Squat', muscleGroup: 'Quads', isDefault: true },
  { name: 'Leg Press', muscleGroup: 'Quads', isDefault: true },
  { name: 'Leg Extension', muscleGroup: 'Quads', isDefault: true },
  { name: 'Bulgarian Split Squat', muscleGroup: 'Quads', isDefault: true },
  { name: 'Lunge', muscleGroup: 'Quads', isDefault: true },
  { name: 'Walking Lunge', muscleGroup: 'Quads', isDefault: true },
  { name: 'Step Up', muscleGroup: 'Quads', isDefault: true },

  // -------- Hamstrings --------
  { name: 'Barbell Romanian Deadlift', muscleGroup: 'Hamstrings', isDefault: true },
  { name: 'Smith Romanian Deadlift', muscleGroup: 'Hamstrings', isDefault: true },
  { name: 'Barbell Stiff Leg Deadlift', muscleGroup: 'Hamstrings', isDefault: true },
  { name: 'Smith Stiff Leg Deadlift', muscleGroup: 'Hamstrings', isDefault: true },
  { name: 'Seated Leg Curl', muscleGroup: 'Hamstrings', isDefault: true },
  { name: 'Lying Leg Curl', muscleGroup: 'Hamstrings', isDefault: true },
  { name: 'Nordic Curl', muscleGroup: 'Hamstrings', isDefault: true },
  { name: 'Barbell Good Morning', muscleGroup: 'Hamstrings', isDefault: true },

  // -------- Glutes --------
  { name: 'Hip Thrust Machine', muscleGroup: 'Glutes', isDefault: true },
  { name: 'Barbell Hip Thrust', muscleGroup: 'Glutes', isDefault: true },
  { name: 'Cable Kickback', muscleGroup: 'Glutes', isDefault: true },

  // -------- Adductors --------
  { name: 'Adductor Machine', muscleGroup: 'Adductors', isDefault: true },
  { name: 'Cable Hip Adduction', muscleGroup: 'Adductors', isDefault: true },

  // -------- Calves --------
  { name: 'Standing Calf Raise', muscleGroup: 'Calves', isDefault: true },
  { name: 'Seated Calf Raise', muscleGroup: 'Calves', isDefault: true },
  { name: 'Leg Press Calf Raise', muscleGroup: 'Calves', isDefault: true },

  // -------- Core --------
  // { name: 'Plank', muscleGroup: 'Core', isDefault: true },
  // { name: 'Side Plank', muscleGroup: 'Core', isDefault: true },
  { name: 'Cable Crunch', muscleGroup: 'Core', isDefault: true },
  { name: 'Hanging Leg Raise', muscleGroup: 'Core', isDefault: true },
  { name: 'Hanging Knee Raise', muscleGroup: 'Core', isDefault: true },
  // { name: 'Ab Wheel Rollout', muscleGroup: 'Core', isDefault: true },
  { name: 'Crunch', muscleGroup: 'Core', isDefault: true },
  { name: 'Decline Crunch', muscleGroup: 'Core', isDefault: true },
  { name: 'Russian Twist', muscleGroup: 'Core', isDefault: true },
];
