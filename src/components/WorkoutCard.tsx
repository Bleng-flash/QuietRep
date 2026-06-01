import { layout, spacing, typography } from "@/styles";
import type { Exercise, MuscleGroup, Workout } from "@/types";
import { Pressable, StyleSheet, Text } from "react-native";

interface WorkoutCardProps {
  workout: Workout;
  allExercises: Exercise[];
  onPress: () => void;
}

export default function WorkoutCard({
  workout,
  allExercises,
  onPress,
}: WorkoutCardProps) {
  const muscleGroups = Array.from(
    new Set(
      workout.exercises
        .map(
          (workoutExercise) =>
            allExercises.find(
              (exercise) => exercise.id === workoutExercise.exerciseId,
            )?.muscleGroup,
        )
        .filter((muscleGroup): muscleGroup is MuscleGroup =>
          Boolean(muscleGroup),
        ),
    ),
  );

  const exerciseCount = workout.exercises.length;
  const subtitle =
    exerciseCount === 0
      ? "No exercises yet"
      : `${exerciseCount} exercise${exerciseCount === 1 ? "" : "s"}${
          muscleGroups.length > 0 ? " : " + muscleGroups.join(" | ") : ""
        }`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [layout.card, pressed && styles.pressed]}
    >
      <Text style={typography.subheading} numberOfLines={1}>
        {workout.name}
      </Text>
      <Text
        style={[typography.caption, { marginTop: spacing.xs }]}
        numberOfLines={1}
      >
        {subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.75,
  },
});
