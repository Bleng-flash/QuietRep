import WorkoutCard from "@/components/WorkoutCard";
import { colors, layout, spacing, typography } from "@/styles";
import type { Exercise, Workout } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface SplitDayRowProps {
  dayLabel: string;
  workouts: Workout[];
  allExercises: Exercise[];
  onAdd: () => void;
  onRemove: (workoutId: string) => void;
}

export default function SplitDayRow({
  dayLabel,
  workouts,
  allExercises,
  onAdd,
  onRemove,
}: SplitDayRowProps) {
  return (
    <View style={styles.container}>
      {/* ── Day header ── */}
      <View style={[layout.rowBetween, styles.header]}>
        <Text style={[typography.label, styles.dayLabel]}>{dayLabel}</Text>
        <Pressable
          onPress={onAdd}
          hitSlop={8}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Ionicons name="add" size={22} color={colors.dark.primary} />
        </Pressable>
      </View>

      {/* ── Assigned workouts or rest day placeholder ── */}
      {workouts.length > 0 ? (
        <View style={styles.workoutList}>
          {workouts.map((workout) => (
            <View key={workout.id} style={styles.workoutRow}>
              <View style={styles.workoutCardWrapper}>
                <WorkoutCard
                  workout={workout}
                  allExercises={allExercises}
                  onPress={() => {}}
                />
              </View>
              <Pressable
                onPress={() => onRemove(workout.id)}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.removeButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="close-circle"
                  size={22}
                  color={colors.dark.error}
                />
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[typography.caption, styles.restLabel]}>Rest day</Text>
      )}

      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.s,
  },
  header: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.xs,
  },
  dayLabel: {
    color: colors.dark.textSubtle,
  },
  workoutList: {
    paddingHorizontal: spacing.m,
    gap: spacing.s,
    paddingBottom: spacing.s,
  },
  workoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s,
  },
  workoutCardWrapper: {
    flex: 1,
  },
  removeButton: {
    paddingLeft: spacing.xs,
  },
  restLabel: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.s,
    color: colors.dark.textDisabled,
  },
  divider: {
    height: 1,
    backgroundColor: colors.dark.borderSubtle,
    marginHorizontal: spacing.m,
  },
  pressed: {
    opacity: 0.6,
  },
});