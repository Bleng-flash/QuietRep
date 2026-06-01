import { buildWorkoutSubtitle } from "@/utils/workout";
import { colors, layout, picker, spacing, typography } from "@/styles";
import type { Exercise, Workout } from "@/types";
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={picker.container}>
        <View style={[layout.rowBetween, picker.header]}>
          <Text style={typography.heading}>Add Workout</Text>
          <Pressable onPress={handleClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.dark.textSubtle} />
          </Pressable>
        </View>

        <View style={picker.searchRow}>
          <Ionicons name="search" size={16} color={colors.dark.textSubtle} />
          <TextInput
            style={picker.searchInput}
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
                {buildWorkoutSubtitle(workout, allExercises)}
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
                picker.createButton,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={colors.dark.primary}
              />
              <Text style={picker.createLabel}>Create new workout</Text>
            </Pressable>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  workoutItem: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.borderSubtle,
    gap: spacing.xs,
  },
});