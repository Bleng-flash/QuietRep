import ExerciseCard from "@/components/ExerciseCard";
import ExercisePicker from "@/components/ExercisePicker";
import { getExercises } from "@/storage";
import { colors, layout, spacing, typography } from "@/styles";
import type { Exercise, SetScheme, Workout, WorkoutExercise } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface WorkoutEditorProps {
  initialWorkout?: Workout;
  onSave: (name: string, exercises: WorkoutExercise[]) => Promise<void>;
  onCancel: () => void;
  onCreateExercise: () => void;
  onDelete?: () => void;
}

export default function WorkoutEditor({
  initialWorkout,
  onSave,
  onCancel,
  onCreateExercise,
  onDelete,
}: WorkoutEditorProps) {
  const isEditMode = initialWorkout !== undefined;
  const insets = useSafeAreaInsets();

  const [workoutName, setWorkoutName] = useState(initialWorkout?.name ?? "");
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>(
    initialWorkout?.exercises ?? [],
  );
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function loadExercises() {
        const exercises = await getExercises();
        setAllExercises(exercises);
      }
      loadExercises();
    }, []),
  );

  const alreadyAddedIds = new Set(workoutExercises.map((workoutExercise) => workoutExercise.exerciseId));

  function handleAddExercise(exercise: Exercise) {
    const newEntry: WorkoutExercise = {
      exerciseId: exercise.id,
      sets: [{ reps: 8, load: 0 }],
    };
    setWorkoutExercises((prev) => [...prev, newEntry]);
  }

  function handleRemoveExercise(exerciseIndex: number) {
    setWorkoutExercises((prev) => prev.filter((_, index) => index !== exerciseIndex));
  }

  function handleSetsChange(exerciseIndex: number, updatedSets: SetScheme[]) {
    setWorkoutExercises((prev) =>
      prev.map((workoutExercise, i) =>
        i === exerciseIndex
          ? { ...workoutExercise, sets: updatedSets }
          : workoutExercise,
      ),
    );
  }

  function handleMoveUp(exerciseIndex: number) {
    if (exerciseIndex === 0) return;
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      [updated[exerciseIndex - 1], updated[exerciseIndex]] = [
        updated[exerciseIndex],
        updated[exerciseIndex - 1],
      ];
      return updated;
    });
  }

  function handleMoveDown(exerciseIndex: number) {
    if (exerciseIndex === workoutExercises.length - 1) return;
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      [updated[exerciseIndex], updated[exerciseIndex + 1]] = [
        updated[exerciseIndex + 1],
        updated[exerciseIndex],
      ];
      return updated;
    });
  }

  function handleDelete() {
    Alert.alert("Delete workout?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ]);
  }

  async function handleSave() {
    if (!workoutName.trim()) {
      Alert.alert("Name required", "Please give this workout a name.");
      return;
    }
    if (workoutExercises.length === 0) {
      Alert.alert("No exercises", "Add at least one exercise before saving.");
      return;
    }
    setIsSaving(true);
    try {
      await onSave(workoutName.trim(), workoutExercises);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={layout.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          layout.rowBetween,
          styles.topBar,
          { paddingTop: insets.top + spacing.s },
        ]}
      >
        <Pressable
          onPress={onCancel}
          hitSlop={8}
          style={({ pressed }) => [pressed && { opacity: 0.5 }]}
        >
          <Text style={styles.cancelLabel}>Cancel</Text>
        </Pressable>

        <Text style={typography.subheading}>
          {isEditMode ? "Edit Workout" : "New Workout"}
        </Text>

        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          hitSlop={8}
          style={({ pressed }) => [pressed && { opacity: 0.5 }]}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.dark.primary} />
          ) : (
            <Text style={styles.saveLabel}>Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={styles.nameInput}
          value={workoutName}
          onChangeText={setWorkoutName}
          placeholder="Workout name"
          placeholderTextColor={colors.dark.textDisabled}
          returnKeyType="done"
          maxLength={60}
        />

        {workoutExercises.map((workoutExercise, exerciseIndex) => (
          <ExerciseCard
            key={workoutExercise.exerciseId}
            workoutExercise={workoutExercise}
            exercise={allExercises.find(
              (exercise) => exercise.id === workoutExercise.exerciseId,
            )}
            isFirst={exerciseIndex === 0}
            isLast={exerciseIndex === workoutExercises.length - 1}
            onSetsChange={(updatedSets) =>
              handleSetsChange(exerciseIndex, updatedSets)
            }
            onRemove={() => handleRemoveExercise(exerciseIndex)}
            onMoveUp={() => handleMoveUp(exerciseIndex)}
            onMoveDown={() => handleMoveDown(exerciseIndex)}
          />
        ))}

        <Pressable
          onPress={() => setIsPickerVisible(true)}
          style={({ pressed }) => [
            styles.addExerciseButton,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Ionicons name="add" size={20} color={colors.dark.primary} />
          <Text style={styles.addExerciseLabel}>Add exercise</Text>
        </Pressable>

        {workoutExercises.length === 0 && (
          <Text style={[typography.caption, styles.emptyHint]}>
            Add exercises to build your workout template. Sets and reps here are
            pre-filled when you start a session.
          </Text>
        )}

        {isEditMode && onDelete && (
          <Pressable
            onPress={handleDelete}
            hitSlop={8}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={colors.dark.error}
            />
            <Text style={styles.deleteLabel}>Delete Workout</Text>
          </Pressable>
        )}
      </ScrollView>

      <ExercisePicker
        visible={isPickerVisible}
        allExercises={allExercises}
        alreadyAddedIds={alreadyAddedIds}
        onSelect={handleAddExercise}
        onCreateNew={onCreateExercise}
        onClose={() => setIsPickerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.borderSubtle,
  },
  cancelLabel: {
    fontSize: 15,
    color: colors.dark.textSubtle,
  },
  saveLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.dark.primary,
  },
  scrollContent: {
    padding: spacing.m,
    paddingBottom: spacing.xxl,
  },
  nameInput: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.dark.text,
    letterSpacing: 0.3,
    marginBottom: spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
    paddingBottom: spacing.s,
  },
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.s,
    borderWidth: 1,
    borderColor: colors.dark.primary,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: spacing.m,
    marginBottom: spacing.m,
    backgroundColor: colors.dark.primarySubtle,
  },
  addExerciseLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.dark.primary,
  },
  emptyHint: {
    textAlign: "center",
    paddingHorizontal: spacing.l,
    lineHeight: 18,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.s,
    borderWidth: 1,
    borderColor: colors.dark.error,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: spacing.m,
    marginTop: spacing.l,
    backgroundColor: colors.dark.errorSubtle,
  },
  deleteLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.dark.error,
  },
});
