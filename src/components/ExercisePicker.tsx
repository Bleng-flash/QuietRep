import { colors, layout, picker, spacing, typography } from "@/styles";
import type { Exercise } from "@/types";
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

interface ExercisePickerProps {
  visible: boolean;
  allExercises: Exercise[];
  alreadyAddedIds: Set<string>;
  onSelect: (exercise: Exercise) => void;
  onCreateNew: () => void;
  onClose: () => void;
}

export default function ExercisePicker({
  visible,
  allExercises,
  alreadyAddedIds,
  onSelect,
  onCreateNew,
  onClose,
}: ExercisePickerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredExercises = allExercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  function handleClose() {
    setSearchQuery("");
    onClose();
  }

  function handleSelect(exercise: Exercise) {
    onSelect(exercise);
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
          <Text style={typography.heading}>Add Exercise</Text>
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
            placeholder="Search exercises…"
            placeholderTextColor={colors.dark.textDisabled}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>

        <FlatList
          data={filteredExercises}
          keyExtractor={(exercise) => exercise.id}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          renderItem={({ item: exercise }) => {
            const alreadyAdded = alreadyAddedIds.has(exercise.id);
            return (
              <Pressable
                onPress={() => !alreadyAdded && handleSelect(exercise)}
                style={({ pressed }) => [
                  styles.exerciseItem,
                  alreadyAdded && { opacity: 0.45 },
                  pressed && !alreadyAdded && { opacity: 0.6 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={typography.body}>{exercise.name}</Text>
                  <Text style={typography.caption}>{exercise.muscleGroup}</Text>
                </View>
                {alreadyAdded && <Text style={styles.addedBadge}>Added</Text>}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text
              style={[
                typography.caption,
                { textAlign: "center", marginTop: spacing.xl },
              ]}
            >
              No exercises found
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
              <Text style={picker.createLabel}>Create new exercise</Text>
            </Pressable>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.borderSubtle,
  },
  addedBadge: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.dark.primary,
    backgroundColor: colors.dark.primarySubtle,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
});
