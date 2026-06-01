import { colors, layout, spacing, typography } from "@/styles";
import type { Exercise, MuscleGroup, Workout } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface WorkoutPickerProps {
  visible: boolean;
  standaloneWorkouts: Workout[];
  allExercises: Exercise[];
  onSelect: (workout: Workout) => void;
  onCreateNew: () => void;
  onClose: () => void;
}

export default function WorkoutPicker({
  visible,
  standaloneWorkouts,
  allExercises,
  onSelect,
  onCreateNew,
  onClose,
}: WorkoutPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredWorkouts = standaloneWorkouts.filter((workout) =>
    workout.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  function handleClose() {
    setSearchQuery("");
    onClose();
  }

  function handleSelect(workout: Workout) {
    onSelect(workout);
    handleClose();
  }

  function handleCreateNew() {
    handleClose();
    onCreateNew();
  }

  function buildSubtitle(workout: Workout): string {
    const exerciseCount = workout.exercises.length;
    if (exerciseCount === 0) return "No exercises yet";

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

    return `${exerciseCount} exercise${exerciseCount === 1 ? "" : "s"}${
      muscleGroups.length > 0 ? " : " + muscleGroups.join(" | ") : ""
    }`;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={[layout.rowBetween, styles.header]}>
          <Text style={typography.heading}>Add Workout</Text>
          <Pressable onPress={handleClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.dark.textSubtle} />
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color={colors.dark.textSubtle} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search workouts…"
            placeholderTextColor={colors.dark.textDisabled}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>

        <FlatList
          data={filteredWorkouts}
          keyExtractor={(workout) => workout.id}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          renderItem={({ item: workout }) => (
            <Pressable
              onPress={() => handleSelect(workout)}
              style={({ pressed }) => [
                styles.workoutItem,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text style={typography.body} numberOfLines={1}>
                {workout.name}
              </Text>
              <Text style={typography.caption} numberOfLines={1}>
                {buildSubtitle(workout)}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text
              style={[
                typography.caption,
                { textAlign: "center", marginTop: spacing.xl },
              ]}
            >
              No workouts found
            </Text>
          }
          ListFooterComponent={
            <Pressable
              onPress={handleCreateNew}
              style={({ pressed }) => [
                styles.createNewButton,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={colors.dark.primary}
              />
              <Text style={styles.createNewLabel}>Create new workout</Text>
            </Pressable>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
    paddingTop: spacing.m,
  },
  header: {
    paddingHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s,
    backgroundColor: colors.dark.inputBackground,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s + 2,
    marginHorizontal: spacing.m,
    marginBottom: spacing.s,
  },
  searchInput: {
    flex: 1,
    color: colors.dark.text,
    fontSize: 15,
  },
  workoutItem: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.borderSubtle,
    gap: spacing.xs,
  },
  createNewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m + spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
    marginTop: spacing.s,
  },
  createNewLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.dark.primary,
  },
});