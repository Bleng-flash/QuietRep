import { colors, layout, spacing, typography } from "@/styles";
import type { Exercise, Workout } from "@/types";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface WorkoutViewerProps {
  workout: Workout;
  allExercises: Exercise[];
  onClose: () => void;
}

export default function WorkoutViewer({
  workout,
  allExercises,
  onClose,
}: WorkoutViewerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={layout.screen}>
      {/* ── Header ── */}
      <View
        style={[
          layout.rowBetween,
          styles.topBar,
          { paddingTop: insets.top + spacing.s },
        ]}
      >
        {/* Left spacer mirrors the width of Close so the title is visually centred */}
        <View style={styles.headerSpacer} />

        <Text style={typography.subheading} numberOfLines={1}>
          {workout.name}
        </Text>

        <Pressable
          onPress={onClose}
          hitSlop={8}
          style={({ pressed }) => [pressed && { opacity: 0.5 }]}
        >
          <Text style={styles.closeLabel}>Close</Text>
        </Pressable>
      </View>

      {/* ── Exercise list ── */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {workout.exercises.length === 0 ? (
          <Text style={[typography.caption, styles.emptyHint]}>
            This workout has no exercises.
          </Text>
        ) : (
          workout.exercises.map((workoutExercise) => {
            const exercise = allExercises.find(
              (exercise) => exercise.id === workoutExercise.exerciseId,
            );

            return (
              <View key={workoutExercise.exerciseId} style={styles.exerciseCard}>
                {/* Exercise name + muscle group */}
                <Text style={typography.subheading} numberOfLines={1}>
                  {exercise?.name ?? "Unknown exercise"}
                </Text>
                {exercise?.muscleGroup ? (
                  <Text
                    style={[typography.caption, { marginBottom: spacing.s }]}
                  >
                    {exercise.muscleGroup}
                  </Text>
                ) : null}

                {/* Column headers — same layout as ExerciseCard */}
                <View
                  style={[
                    layout.row,
                    { gap: spacing.s, marginBottom: spacing.xs },
                  ]}
                >
                  <View style={styles.setIndexCell} />
                  <Text
                    style={[typography.caption, styles.setValueCell]}
                  >
                    Reps
                  </Text>
                  <Text
                    style={[typography.caption, styles.setValueCell]}
                  >
                    Load (kg)
                  </Text>
                </View>

                {/* One row per set */}
                {workoutExercise.sets.map((setScheme, setIndex) => (
                  <View
                    key={setIndex}
                    style={[
                      layout.row,
                      styles.setRow,
                      { gap: spacing.s },
                    ]}
                  >
                    <Text
                      style={[typography.body, styles.setIndexCell]}
                    >
                      {setIndex + 1}
                    </Text>
                    <Text
                      style={[typography.body, styles.setValueCell]}
                    >
                      {setScheme.reps}
                    </Text>
                    <Text
                      style={[typography.body, styles.setValueCell]}
                    >
                      {setScheme.load}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.borderSubtle,
  },
  // Approximate width of "Close" text — keeps the title visually centred
  headerSpacer: {
    minWidth: 44,
  },
  closeLabel: {
    fontSize: 15,
    color: colors.dark.textSubtle,
  },
  scrollContent: {
    padding: spacing.m,
    paddingBottom: spacing.xxl,
  },

  // ── Exercise card ──
  exerciseCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },

  // ── Set table ──
  setRow: {
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.dark.borderSubtle,
  },
  // Fixed-width column for the set number (matches ExerciseCard's set-number spacer width)
  setIndexCell: {
    width: 44,
    textAlign: "center",
  },
  setValueCell: {
    flex: 1,
    textAlign: "center",
  },

  emptyHint: {
    textAlign: "center",
    paddingHorizontal: spacing.l,
    lineHeight: 18,
    marginTop: spacing.m,
  },
});