import EditorHeader from '@/components/shared/EditorHeader';
import ExercisePicker from '@/components/shared/ExercisePicker';
import WorkoutExerciseCard from '@/components/plan/WorkoutExerciseCard';
import { getAllExercises } from '@/storage';
import { colors, layout, spacing, typography } from '@/styles';
import type {
  EditableSet,
  Exercise,
  ResolvedEditableWorkoutExercise,
  Workout,
  WorkoutExercise,
} from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { v4 as uuid } from 'uuid';

interface WorkoutEditorProps {
  initialWorkout?: Workout;
  onSave: (name: string, exercises: WorkoutExercise[]) => Promise<void>;
  onDelete?: () => void;
}

// The editor's working shape: each exercise's sets carry an editor-only localKey, but the
// Exercise join hasn't happened yet — i.e. ResolvedEditableWorkoutExercise minus `exercise`.
type EditableWorkoutExercise = Omit<ResolvedEditableWorkoutExercise, 'exercise'>;

// Attach a fresh localKey to every set when seeding editor state from stored data.
function toEditableExercises(exercises: WorkoutExercise[]): EditableWorkoutExercise[] {
  return exercises.map((workoutExercise) => ({
    ...workoutExercise,
    sets: workoutExercise.sets.map((setScheme) => ({ ...setScheme, localKey: uuid() })),
  }));
}

export default function WorkoutEditor({
  initialWorkout,
  onSave,
  onDelete,
}: WorkoutEditorProps) {
  const isEditMode = initialWorkout !== undefined;

  const [workoutName, setWorkoutName] = useState(initialWorkout?.name ?? '');
  // Seed with localKeys attached so set rows have stable identities from the first render.
  const [workoutExercises, setWorkoutExercises] = useState<EditableWorkoutExercise[]>(() =>
    toEditableExercises(initialWorkout?.exercises ?? []),
  );
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function loadExercises() {
        const exercises = await getAllExercises();
        setAllExercises(exercises);
      }
      loadExercises();
    }, []),
  );

  // Stable Set reference — only recomputes when workoutExercises changes, so ExercisePicker's
  // renderItem useCallback dep doesn't fire on every WorkoutEditor re-render
  const alreadyAddedIds = useMemo(
    () => new Set(workoutExercises.map((workoutExercise) => workoutExercise.exerciseId)),
    [workoutExercises],
  );

  // Pre-build an id→Exercise map once so the join below is O(1) per entry rather than
  // O(n) — without this, resolving each EditableWorkoutExercise would call .find() across all
  // exercises on every render, which is O(n²) across the whole list.
  const exerciseMap = useMemo(
    () => new Map(allExercises.map((exercise) => [exercise.id, exercise])),
    [allExercises],
  );

  // Join EditableWorkoutExercise (sets data) with Exercise (display data) once per render cycle.
  // WorkoutExerciseCard receives a single ResolvedEditableWorkoutExercise prop instead of two
  // separate props, and the O(n²) .find()-per-card in the render loop is eliminated.
  const resolvedWorkoutExercises: ResolvedEditableWorkoutExercise[] = useMemo(
    () =>
      workoutExercises.map((workoutExercise) => ({
        ...workoutExercise,
        exercise: exerciseMap.get(workoutExercise.exerciseId),
      })),
    [workoutExercises, exerciseMap],
  );

  function handleAddExercise(exercise: Exercise) {
    const newEntry: EditableWorkoutExercise = {
      exerciseId: exercise.id,
      sets: [{ minReps: 0, maxReps: 0, localKey: uuid() }],
    };
    setWorkoutExercises((prev) => [...prev, newEntry]);
  }

  function handleRemoveExercise(exerciseIndex: number) {
    setWorkoutExercises((prev) => prev.filter((_, index) => index !== exerciseIndex));
  }

  function handleSetsChange(exerciseIndex: number, updatedSets: EditableSet[]) {
    setWorkoutExercises((prev) =>
      prev.map((workoutExercise, index) =>
        index === exerciseIndex ? { ...workoutExercise, sets: updatedSets } : workoutExercise,
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
    Alert.alert('Delete workout?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  }

  async function handleSave() {
    if (!workoutName.trim()) {
      Alert.alert('Name required', 'Please give this workout a name.');
      return;
    }
    if (workoutExercises.length === 0) {
      Alert.alert('No exercises', 'Add at least one exercise before saving.');
      return;
    }
    setIsSaving(true);
    try {
      // Strip the editor-only localKey so storage receives plain SetScheme ({ minReps, maxReps }).
      // This is the single guard keeping localKey out of persisted data.
      const exercisesToSave: WorkoutExercise[] = workoutExercises.map((workoutExercise) => ({
        ...workoutExercise,
        sets: workoutExercise.sets.map((setScheme) => ({
          minReps: setScheme.minReps,
          maxReps: setScheme.maxReps,
        })),
      }));
      await onSave(workoutName.trim(), exercisesToSave);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={layout.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <EditorHeader
        title={isEditMode ? 'Edit Workout' : 'New Workout'}
        onCancel={() => router.back()}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TextInput
          style={[typography.heading, styles.nameInput]}
          value={workoutName}
          onChangeText={setWorkoutName}
          placeholder="Workout name"
          placeholderTextColor={colors.dark.textDisabled}
          returnKeyType="done"
          maxLength={60}
        />

        {resolvedWorkoutExercises.map((resolvedWorkoutExercise, exerciseIndex) => (
          <WorkoutExerciseCard
            key={resolvedWorkoutExercise.exerciseId}
            resolvedWorkoutExercise={resolvedWorkoutExercise}
            isFirst={exerciseIndex === 0}
            isLast={exerciseIndex === workoutExercises.length - 1}
            onSetsChange={(updatedSets) => handleSetsChange(exerciseIndex, updatedSets)}
            onRemove={() => handleRemoveExercise(exerciseIndex)}
            onMoveUp={() => handleMoveUp(exerciseIndex)}
            onMoveDown={() => handleMoveDown(exerciseIndex)}
          />
        ))}

        <Pressable
          onPress={() => setIsPickerVisible(true)}
          style={({ pressed }) => [layout.addButton, { marginBottom: spacing.m }, pressed && layout.pressedButton]}
        >
          <Ionicons name="add" size={20} color={colors.dark.primary} />
          <Text style={typography.actionPrimary}>Add exercise</Text>
        </Pressable>

        {workoutExercises.length === 0 && (
          <Text style={[typography.caption, styles.emptyHint]}>
            Add exercises to build your workout template.
          </Text>
        )}

        {isEditMode && onDelete && (
          <Pressable
            onPress={handleDelete}
            hitSlop={8}
            style={({ pressed }) => [
              layout.dangerButton,
              { marginTop: spacing.l },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="trash-outline" size={18} color={colors.dark.error} />
            <Text style={typography.actionDanger}>Delete Workout</Text>
          </Pressable>
        )}
      </ScrollView>

      <ExercisePicker
        visible={isPickerVisible}
        allExercises={allExercises}
        alreadyAddedIds={alreadyAddedIds}
        onSelect={handleAddExercise}
        onClose={() => setIsPickerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.m,
    paddingBottom: spacing.xxl,
  },
  nameInput: {
    marginBottom: spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
    paddingBottom: spacing.s,
  },
  emptyHint: {
    textAlign: 'center',
    paddingHorizontal: spacing.l,
    lineHeight: 18,
  },
});
