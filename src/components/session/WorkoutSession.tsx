import RecentPerformancesSheet from '@/components/session/RecentPerformancesSheet';
import SessionExerciseCard from '@/components/session/SessionExerciseCard';
import SessionHeader from '@/components/session/SessionHeader';
import DraggableCardList, {
  DRAG_LONG_PRESS_DELAY_MS,
} from '@/components/shared/DraggableCardList';
import EmptyState from '@/components/shared/EmptyState';
import ExercisePicker from '@/components/shared/ExercisePicker';
import KeyboardSpacer from '@/components/shared/KeyboardSpacer';
import { useActiveSession } from '@/context/ActiveSessionContext';
import { useTheme } from '@/context/ThemeContext';
import { getAllExercises } from '@/storage';
import { spacing } from '@/styles';
import type {
  EditableLoggedSet,
  EditableSessionExercise,
  Exercise,
  ResolvedEditableSessionExercise,
} from '@/types';
import { isLoggedSetValid } from '@/utils/session';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Keyboard, Pressable, Text, View } from 'react-native';
import { ScrollViewContainer } from 'react-native-reorderable-list';
import { v4 as uuid } from 'uuid';

export default function WorkoutSession() {
  const { colors, layout, typography } = useTheme();
  const { activeSession, updateActiveSession, finishActiveSession, discardActiveSession } =
    useActiveSession();

  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  // Which exercise the recent-history sheet is showing; null when closed. Held here rather than
  // per-card so there is one Modal for the screen (like ExercisePicker) instead of one mounted
  // inside every draggable row.
  const [historyTarget, setHistoryTarget] = useState<{ exerciseId: string; name: string } | null>(
    null,
  );
  const [isFinishing, setIsFinishing] = useState(false);
  // Flipped true by the first failed finish; from then on invalid sets are highlighted red and
  // recomputed live from state, so the red clears as the user fixes each set.
  const [showErrors, setShowErrors] = useState(false);

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

  // localKeys of every set that fails validation, but only once a finish has been attempted.
  // Recomputes from session state so highlighted rows clear as they become valid.
  const invalidSetKeys = useMemo(() => {
    const keys = new Set<string>();
    if (!showErrors) return keys;
    for (const sessionExercise of activeSession?.exercises ?? []) {
      for (const loggedSet of sessionExercise.sets) {
        if (!isLoggedSetValid(loggedSet)) keys.add(loggedSet.localKey);
      }
    }
    return keys;
  }, [showErrors, activeSession?.exercises]);

  function handleAddExercise(exercise: Exercise) {
    const newEntry: EditableSessionExercise = {
      exerciseId: exercise.id,
      // Single blank set — no target hints since this exercise wasn't in the original plan.
      sets: [{ weight: 0, reps: 0, localKey: uuid() }],
    };
    updateActiveSession((prev) => ({ ...prev, exercises: [...prev.exercises, newEntry] }));
  }

  function removeExercise(exerciseId: string) {
    updateActiveSession((prev) => ({
      ...prev,
      exercises: prev.exercises.filter(
        (sessionExercise) => sessionExercise.exerciseId !== exerciseId,
      ),
    }));
  }

  function handleRemoveExercise(exerciseId: string) {
    const targetExercise = resolvedSessionExercises.find(
      (sessionExercise) => sessionExercise.exerciseId === exerciseId,
    );
    // Only confirm when there's logged data to lose — removing a freshly-added blank exercise
    // shouldn't nag. A set counts as "logged" once any weight or reps have been entered.
    const hasLoggedData = targetExercise?.sets.some((set) => set.weight > 0 || set.reps > 0);
    if (!hasLoggedData) {
      removeExercise(exerciseId);
      return;
    }
    const exerciseName = targetExercise?.exercise?.name ?? 'this exercise';
    Alert.alert(`Remove ${exerciseName}?`, 'Its logged sets will be lost.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeExercise(exerciseId) },
    ]);
  }

  function handleShowHistory(exerciseId: string, name: string) {
    Keyboard.dismiss();
    setHistoryTarget({ exerciseId, name });
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
    if (activeSession.exercises.length === 0) {
      Alert.alert('No exercises', 'Add at least one exercise before finishing.');
      return;
    }
    const hasInvalidSet = activeSession.exercises.some((sessionExercise) =>
      sessionExercise.sets.some((loggedSet) => !isLoggedSetValid(loggedSet)),
    );
    if (hasInvalidSet) {
      setShowErrors(true);
      Alert.alert('Check your sets', 'Each set needs at least 1 rep and a load of 0 or more.');
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
    <View style={layout.screen}>
      <SessionHeader
        name={activeSession?.name ?? ''}
        startedAt={activeSession?.startedAt ?? new Date().toISOString()}
        onNameChange={(name) => updateActiveSession((prev) => ({ ...prev, name }))}
        onMinimise={handleMinimise}
        onFinish={handleFinish}
        isFinishing={isFinishing}
      />

      <ScrollViewContainer
        contentContainerStyle={{ padding: spacing.m, paddingBottom: spacing.xxl }}
        keyboardShouldPersistTaps="handled"
      >
        {resolvedSessionExercises.length === 0 ? (
          <EmptyState
            icon="barbell-outline"
            title="No exercises yet"
            message="Add an exercise to start logging sets."
          />
        ) : (
          <DraggableCardList
            data={resolvedSessionExercises}
            keyExtractor={(item) => item.exerciseId}
            onReorder={handleReorderExercises}
            separatorHeight={spacing.m}
            renderCard={(item, drag) => (
              <Pressable
                onLongPress={drag}
                delayLongPress={DRAG_LONG_PRESS_DELAY_MS}
                // This wrapper wins the responder for every tap on the card (a Pressable claims the
                // touch start even with no onPress), which starves the ScrollView's
                // onResponderRelease blur — the only thing that dismisses the keyboard under
                // keyboardShouldPersistTaps="handled". Dismissing here restores "tap any non-button
                // area to close the keyboard" across the card. Inner inputs and buttons are deeper,
                // so they win the touch outright and this never fires for them.
                onPress={Keyboard.dismiss}
              >
                <SessionExerciseCard
                  resolvedSessionExercise={item}
                  invalidSetKeys={invalidSetKeys}
                  // Fallback is unreachable: resolvedSessionExercises is [] whenever
                  // activeSession is null, so renderCard never runs in that state.
                  loggedUnit={activeSession?.unit ?? 'kg'}
                  onSetsChange={(updatedSets) => handleSetsChange(item.exerciseId, updatedSets)}
                  onRemove={() => handleRemoveExercise(item.exerciseId)}
                  onShowHistory={() =>
                    handleShowHistory(item.exerciseId, item.exercise?.name ?? 'Unknown exercise')
                  }
                />
              </Pressable>
            )}
          />
        )}

        <Pressable
          onPress={() => setIsPickerVisible(true)}
          style={({ pressed }) => [
            layout.addButton,
            { marginTop: spacing.m },
            pressed && layout.pressedButton,
          ]}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
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
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <Text style={typography.actionDanger}>Discard session</Text>
        </Pressable>

        {/* Collapses to nothing when the keyboard is closed; while it is open this is the tail
            that lets "Add exercise" and "Discard session" be scrolled clear of it. */}
        <KeyboardSpacer />
      </ScrollViewContainer>

      <ExercisePicker
        visible={isPickerVisible}
        allExercises={allExercises}
        alreadyAddedIds={alreadyAddedIds}
        onSelect={handleAddExercise}
        onClose={() => setIsPickerVisible(false)}
      />

      <RecentPerformancesSheet
        visible={historyTarget !== null}
        exerciseId={historyTarget?.exerciseId ?? null}
        exerciseName={historyTarget?.name ?? ''}
        onClose={() => setHistoryTarget(null)}
      />
    </View>
  );
}
