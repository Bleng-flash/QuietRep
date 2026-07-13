import SessionExerciseCard from '@/components/session/SessionExerciseCard';
import SessionHeader from '@/components/session/SessionHeader';
import DraggableCardList from '@/components/shared/DraggableCardList';
import ExercisePicker from '@/components/shared/ExercisePicker';
import { useActiveSession } from '@/context/ActiveSessionContext';
import { getAllExercises } from '@/storage';
import { colors, layout, spacing, typography } from '@/styles';
import type {
  EditableLoggedSet,
  EditableSessionExercise,
  Exercise,
  ResolvedEditableSessionExercise,
} from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text } from 'react-native';
import { ScrollViewContainer } from 'react-native-reorderable-list';
import { v4 as uuid } from 'uuid';

export default function WorkoutSession() {
  const { activeSession, updateActiveSession, finishActiveSession, discardActiveSession } =
    useActiveSession();

  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function loadExercises() {
        const exercises = await getAllExercises();
        setAllExercises(exercises);
      }
      loadExercises();
    }, []),
  );

  // Pre-build an id→Exercise map for O(1) joins in resolvedSessionExercises below.
  const exerciseMap = useMemo(
    () => new Map(allExercises.map((exercise) => [exercise.id, exercise])),
    [allExercises],
  );

  // Join session exercises with Exercise metadata. activeSession could theoretically be null
  // here if the effect in session.tsx hasn't navigated back yet — guard with empty array.
  const resolvedSessionExercises: ResolvedEditableSessionExercise[] = useMemo(
    () =>
      (activeSession?.exercises ?? []).map((sessionExercise) => ({
        ...sessionExercise,
        exercise: exerciseMap.get(sessionExercise.exerciseId),
      })),
    [activeSession?.exercises, exerciseMap],
  );

  // Stable Set — only recomputes when session exercises change, so ExercisePicker's
  // renderItem useCallback dep doesn't fire on every WorkoutSession re-render.
  const alreadyAddedIds = useMemo(
    () =>
      new Set(
        (activeSession?.exercises ?? []).map((sessionExercise) => sessionExercise.exerciseId),
      ),
    [activeSession?.exercises],
  );

  function handleAddExercise(exercise: Exercise) {
    const newEntry: EditableSessionExercise = {
      exerciseId: exercise.id,
      // Single blank set — no target hints since this exercise wasn't in the original plan.
      sets: [{ weight: 0, reps: 0, localKey: uuid() }],
    };
    updateActiveSession((prev) => ({ ...prev, exercises: [...prev.exercises, newEntry] }));
  }

  function handleRemoveExercise(exerciseId: string) {
    updateActiveSession((prev) => ({
      ...prev,
      exercises: prev.exercises.filter(
        (sessionExercise) => sessionExercise.exerciseId !== exerciseId,
      ),
    }));
  }

  function handleSetsChange(exerciseId: string, updatedSets: EditableLoggedSet[]) {
    updateActiveSession((prev) => ({
      ...prev,
      exercises: prev.exercises.map((sessionExercise) =>
        sessionExercise.exerciseId === exerciseId
          ? { ...sessionExercise, sets: updatedSets }
          : sessionExercise,
      ),
    }));
  }

  function handleReorderExercises(reordered: ResolvedEditableSessionExercise[]) {
    // Strip the joined `exercise` field to get back to EditableSessionExercise shape.
    updateActiveSession((prev) => ({
      ...prev,
      exercises: reordered.map(({ exercise: _exercise, ...rest }) => rest),
    }));
  }

  async function handleFinish() {
    // Guard against an empty name reaching history (the user can clear the editable title).
    // Mirrors WorkoutEditor.handleSave; the default "Quick Workout" means this rarely fires.
    if (!activeSession?.name.trim()) {
      Alert.alert('Name required', 'Please give this session a name before finishing.');
      return;
    }
    setIsFinishing(true);
    try {
      await finishActiveSession();
      router.back();
    } finally {
      setIsFinishing(false);
    }
  }

  // Minimise leaves the session live — pure navigation, no context call. Only Finish/Discard
  // end the session; router.back() just pops /session off the stack so the resume banner shows.
  function handleMinimise() {
    router.back();
  }

  function handleDiscard() {
    Alert.alert('Discard session?', 'All logged sets will be lost.', [
      { text: 'Keep going', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          await discardActiveSession();
          router.back();
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={layout.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SessionHeader
        name={activeSession?.name ?? ''}
        onNameChange={(name) => updateActiveSession((prev) => ({ ...prev, name }))}
        onMinimise={handleMinimise}
        onFinish={handleFinish}
        isFinishing={isFinishing}
      />

      <ScrollViewContainer
        contentContainerStyle={{ padding: spacing.m, paddingBottom: spacing.xxl }}
        keyboardShouldPersistTaps="handled"
      >
        <DraggableCardList
          data={resolvedSessionExercises}
          keyExtractor={(item) => item.exerciseId}
          onReorder={handleReorderExercises}
          separatorHeight={spacing.m}
          renderCard={(item, drag) => (
            <Pressable onLongPress={drag} delayLongPress={200}>
              <SessionExerciseCard
                resolvedSessionExercise={item}
                onSetsChange={(updatedSets) => handleSetsChange(item.exerciseId, updatedSets)}
                onRemove={() => handleRemoveExercise(item.exerciseId)}
              />
            </Pressable>
          )}
        />

        <Pressable
          onPress={() => setIsPickerVisible(true)}
          style={({ pressed }) => [
            layout.addButton,
            { marginTop: spacing.m },
            pressed && layout.pressedButton,
          ]}
        >
          <Ionicons name="add" size={20} color={colors.dark.primary} />
          <Text style={typography.actionPrimary}>Add exercise</Text>
        </Pressable>

        {/* Discard lives here (not the header) so the destructive action is de-emphasised;
            minimise takes the header's prominent corner instead. */}
        <Pressable
          onPress={handleDiscard}
          style={({ pressed }) => [
            layout.dangerButton,
            { marginTop: spacing.m },
            pressed && layout.pressedButton,
          ]}
        >
          <Ionicons name="trash-outline" size={20} color={colors.dark.error} />
          <Text style={typography.actionDanger}>Discard session</Text>
        </Pressable>
      </ScrollViewContainer>

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
