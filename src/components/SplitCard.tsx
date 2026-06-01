import DayCircle from "@/components/DayCircle";
import WorkoutCard from "@/components/WorkoutCard";
import { DAY_KEYS, DAY_LABELS, DAY_NAMES } from "@/constants/days";
import { colors, layout, spacing, typography } from "@/styles";
import type { DayKey, Exercise, Split, Workout } from "@/types";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

// ─── Component ────────────────────────────────────────────────────────────────

interface SplitCardProps {
  split: Split;
  isActive: boolean;
  workouts: Workout[];
  allExercises: Exercise[];
  onPress: () => void;
  onWorkoutPress: (workout: Workout) => void;
}

export default function SplitCard({
  split,
  isActive,
  workouts,
  allExercises,
  onPress,
  onWorkoutPress,
}: SplitCardProps) {
  const [selectedDay, setSelectedDay] = useState<DayKey | null>(null);

  function handleDayPress(day: DayKey) {
    setSelectedDay((previousSelectedDay) => (previousSelectedDay === day ? null : day));
  }

  const selectedWorkouts =
    selectedDay !== null
      ? split.days[selectedDay]
          .map((id) => workouts.find((workout) => workout.id === id))
          .filter((workout): workout is Workout => Boolean(workout))
      : [];

  return (
    <View style={[layout.card, isActive && styles.activeCard]}>
      {/* ── Header: name + badge — tapping navigates to split detail ── */}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [layout.rowBetween, pressed && styles.pressed]}
      >
        <Text style={typography.subheading} numberOfLines={1}>
          {split.name}
        </Text>
        {isActive && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        )}
      </Pressable>

      {/* ── Day circles ── */}
      <View style={styles.dayRow}>
        {DAY_KEYS.map((day) => {
          const hasWorkouts = split.days[day].length > 0;
          const isSelected = selectedDay === day;
          const circleState = isSelected
            ? "selected"
            : hasWorkouts
              ? "workout"
              : "rest";

          return (
            <DayCircle
              key={day}
              label={DAY_LABELS[day]}
              state={circleState}
              onPress={() => handleDayPress(day)}
            />
          );
        })}
      </View>

      {/* ── Expanded day workouts ── */}
      {selectedDay !== null && selectedWorkouts.length > 0 && (
        <View style={styles.expandedSection}>
          <View style={styles.divider} />
          <Text style={styles.expandedDayLabel}>{DAY_NAMES[selectedDay]}</Text>
          {selectedWorkouts.map((workout) => (
            <View key={workout.id} style={styles.expandedWorkout}>
              <WorkoutCard
                workout={workout}
                allExercises={allExercises}
                onPress={() => onWorkoutPress(workout)}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  activeCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.dark.primary,
  },
  pressed: {
    opacity: 0.75,
  },

  // ── Active badge ──
  activeBadge: {
    backgroundColor: colors.dark.primarySubtle,
    borderRadius: 6,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.dark.primary,
    letterSpacing: 0.4,
  },

  // ── Day row ──
  dayRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.m,
  },

  // ── Expanded section ──
  expandedSection: {
    marginTop: spacing.m,
  },
  divider: {
    height: 1,
    backgroundColor: colors.dark.border,
    marginBottom: spacing.m,
  },
  expandedDayLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.dark.textSubtle,
    marginBottom: spacing.s,
    letterSpacing: 0.3,
  },
  expandedWorkout: {
    marginBottom: spacing.s,
  },
});
