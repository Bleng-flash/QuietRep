import SplitDayRow from '@/components/SplitDayRow';
import WorkoutPicker from '@/components/WorkoutPicker';
import { DAY_KEYS, DAY_NAMES } from '@/constants/days';
import { addWorkout, deleteWorkoutsByIds, getAllExercises, getWorkouts } from '@/storage';
import { clearPendingNewWorkoutData, getPendingNewWorkoutData } from '@/storage/pendingNewWorkout';
import { colors, layout, spacing, typography } from '@/styles';
import type { DayKey, Exercise, Split, Workout, WorkoutExercise } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { v4 as uuid } from 'uuid';

// ─── Types ────────────────────────────────────────────────────────────────────

// A workout added this editing session that has NOT yet been written to storage.
// localKey is a UUID used only for React list rendering and remove operations —
// it is NOT a workout id. addWorkout assigns the real persistent id on split save.
type PendingDayWorkout = {
  localKey: string;
  name: string;
  exercises: WorkoutExercise[];
};

// ─── Component ────────────────────────────────────────────────────────────────

interface SplitEditorProps {
  initialSplit?: Split;
  // Pre-resolved by the parent screen: each DayKey mapped to its Workout objects already
  // in storage. Empty arrays for all days when creating a new split.
  initialDayWorkouts: Record<DayKey, Workout[]>;
  isInitiallyActive: boolean;
  onSave: (name: string, days: Record<DayKey, string[]>, setAsActive: boolean) => Promise<void>;
  onCancel: () => void;
  // Called when the user taps "Create new workout" in WorkoutPicker.
  // The screen navigates to /plan/workout/new?embedded=true.
  onCreateWorkout: () => void;
  onDelete?: () => Promise<void>;
}

export default function SplitEditor({
  initialSplit,
  initialDayWorkouts,
  isInitiallyActive,
  onSave,
  onCancel,
  onCreateWorkout,
  onDelete,
}: SplitEditorProps) {
  const isEditMode = initialSplit !== undefined;
  const insets = useSafeAreaInsets();

  // Workouts already persisted in storage (from initialDayWorkouts — all isStandalone: false)
  const [dayWorkouts, setDayWorkouts] = useState<Record<DayKey, Workout[]>>(initialDayWorkouts);
  // New additions this session — not yet in storage; addWorkout creates them on split save
  const [pendingDayWorkouts, setPendingDayWorkouts] = useState<Record<DayKey, PendingDayWorkout[]>>(
    { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
  );
  const [splitName, setSplitName] = useState(initialSplit?.name ?? '');
  const [isActive, setIsActive] = useState(isInitiallyActive);
  const [standaloneWorkouts, setStandaloneWorkouts] = useState<Workout[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);

  // Which day's WorkoutPicker is currently open (null = closed)
  const [pickerDayKey, setPickerDayKey] = useState<DayKey | null>(null);
  // Originally-embedded workout ids removed this session — deleted from storage on save
  const [removedOriginalIds, setRemovedOriginalIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Which day is awaiting a round-trip embedded workout creation.
  // Stored as a ref so useFocusEffect can read it inside its empty-deps callback.
  const pendingEmbeddedDayRef = useRef<DayKey | null>(null);
  // Workout ids that were in storage at the start of this edit session.
  // Used to distinguish "must delete on save" vs "was never in storage".
  const initialEmbeddedIdsRef = useRef<Set<string>>(
    new Set(initialSplit ? Object.values(initialSplit.days).flat() : []),
  );

  // Load standalone workouts and exercises on mount and each time the screen regains
  // focus (e.g. returning from WorkoutEditor after the round-trip).
  useFocusEffect(
    useCallback(() => {
      async function loadData() {
        const [allWorkouts, exercises] = await Promise.all([getWorkouts(), getAllExercises()]);
        setStandaloneWorkouts(allWorkouts.filter((workout) => workout.isStandalone));
        setAllExercises(exercises);

        // Check if WorkoutEditor left data in the in-memory pass-through
        const pendingData = getPendingNewWorkoutData();
        if (pendingData && pendingEmbeddedDayRef.current !== null) {
          const targetDay = pendingEmbeddedDayRef.current;
          const pendingEntry: PendingDayWorkout = {
            localKey: uuid(),
            name: pendingData.name,
            exercises: pendingData.exercises,
          };
          setPendingDayWorkouts((prev) => ({
            ...prev,
            [targetDay]: [...prev[targetDay], pendingEntry],
          }));
          clearPendingNewWorkoutData();
          pendingEmbeddedDayRef.current = null;
        }
      }
      loadData();
    }, []),
  );

  function handleAddWorkout(workout: Workout, dayKey: DayKey) {
    // Store the workout data as a pending entry — the embedded copy is created by
    // addWorkout on split save, not here
    const pendingEntry: PendingDayWorkout = {
      localKey: uuid(),
      name: workout.name,
      exercises: workout.exercises,
    };
    setPendingDayWorkouts((prev) => ({
      ...prev,
      [dayKey]: [...prev[dayKey], pendingEntry],
    }));
    setPickerDayKey(null);
  }

  function handleCreateNew(dayKey: DayKey) {
    // Record the target day before navigating so useFocusEffect can assign the new
    // workout to the right day on return
    pendingEmbeddedDayRef.current = dayKey;
    setPickerDayKey(null);
    onCreateWorkout();
  }

  function handleRemove(workoutId: string, dayKey: DayKey) {
    const isPending = pendingDayWorkouts[dayKey].some(
      (pendingEntry) => pendingEntry.localKey === workoutId,
    );

    if (isPending) {
      // Never in storage — just remove from local state
      setPendingDayWorkouts((prev) => ({
        ...prev,
        [dayKey]: prev[dayKey].filter((pendingEntry) => pendingEntry.localKey !== workoutId),
      }));
    } else {
      // Real embedded workout already in storage — remove from dayWorkouts and
      // mark for deletion when the split is saved
      setDayWorkouts((prev) => ({
        ...prev,
        [dayKey]: prev[dayKey].filter((workout) => workout.id !== workoutId),
      }));
      if (initialEmbeddedIdsRef.current.has(workoutId)) {
        setRemovedOriginalIds((prev) => [...prev, workoutId]);
      }
    }
  }

  async function handleSave() {
    if (!splitName.trim()) {
      Alert.alert('Name required', 'Please give this split a name.');
      return;
    }
    setIsSaving(true);
    try {
      // Build finalDays by combining already-stored embedded workouts and pending ones.
      // addWorkout is called here for the first time for every pending entry — this is
      // the only place pending workouts are written to storage.
      const finalDays = {} as Record<DayKey, string[]>;
      for (const dayKey of DAY_KEYS) {
        const workoutIds: string[] = [];

        for (const workout of dayWorkouts[dayKey]) {
          workoutIds.push(workout.id);
        }

        for (const pendingEntry of pendingDayWorkouts[dayKey]) {
          const savedWorkout = await addWorkout({
            name: pendingEntry.name,
            exercises: pendingEntry.exercises,
            isStandalone: false,
          });
          workoutIds.push(savedWorkout.id);
        }

        finalDays[dayKey] = workoutIds;
      }

      if (removedOriginalIds.length > 0) {
        await deleteWorkoutsByIds(removedOriginalIds);
      }

      await onSave(splitName.trim(), finalDays, isActive);
    } finally {
      setIsSaving(false);
    }
  }

  function handleDeleteSplit() {
    Alert.alert('Delete split?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete?.() },
    ]);
  }

  // Merge persisted workouts and pending entries into a single display array for SplitDayRow.
  // Pending entries are given the Workout shape using localKey as id (display identity only).
  function buildDisplayWorkouts(dayKey: DayKey): Workout[] {
    const pendingAsWorkouts: Workout[] = pendingDayWorkouts[dayKey].map((pendingEntry) => ({
      id: pendingEntry.localKey,
      name: pendingEntry.name,
      exercises: pendingEntry.exercises,
      isStandalone: false,
    }));
    return [...dayWorkouts[dayKey], ...pendingAsWorkouts];
  }

  return (
    <KeyboardAvoidingView
      style={layout.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Top bar ── */}
      <View style={[layout.rowBetween, layout.topBar, { paddingTop: insets.top + spacing.s }]}>
        <Pressable
          onPress={onCancel}
          hitSlop={8}
          style={({ pressed }) => [pressed && { opacity: 0.5 }]}
        >
          <Text style={typography.actionSubtle}>Cancel</Text>
        </Pressable>

        <Text style={typography.subheading}>{isEditMode ? 'Edit Split' : 'New Split'}</Text>

        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          hitSlop={8}
          style={({ pressed }) => [pressed && { opacity: 0.5 }]}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.dark.primary} />
          ) : (
            <Text style={typography.actionPrimary}>Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* ── Split name ── */}
        <TextInput
          style={[typography.heading, styles.nameInput]}
          value={splitName}
          onChangeText={setSplitName}
          placeholder="Split name"
          placeholderTextColor={colors.dark.textDisabled}
          returnKeyType="done"
          maxLength={60}
        />

        {/* ── Active split toggle ── */}
        <View style={[layout.rowBetween, styles.activeRow]}>
          <Text style={typography.body}>Active split</Text>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: colors.dark.border, true: colors.dark.primary }}
            thumbColor={colors.dark.text}
          />
        </View>

        {/* ── Days ── */}
        <Text style={[typography.heading, styles.daysHeading]}>Days</Text>
        <View style={styles.daysContainer}>
          {DAY_KEYS.map((dayKey) => (
            <SplitDayRow
              key={dayKey}
              dayLabel={DAY_NAMES[dayKey]}
              workouts={buildDisplayWorkouts(dayKey)}
              allExercises={allExercises}
              onAdd={() => setPickerDayKey(dayKey)}
              onRemove={(workoutId) => handleRemove(workoutId, dayKey)}
            />
          ))}
        </View>

        {/* ── Delete (edit mode only) ── */}
        {isEditMode && onDelete && (
          <Pressable
            onPress={handleDeleteSplit}
            hitSlop={8}
            style={({ pressed }) => [
              layout.dangerButton,
              { marginHorizontal: spacing.m, marginTop: spacing.l },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="trash-outline" size={18} color={colors.dark.error} />
            <Text style={typography.actionDanger}>Delete Split</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* ── Workout picker modal ── */}
      <WorkoutPicker
        visible={pickerDayKey !== null}
        standaloneWorkouts={standaloneWorkouts}
        allExercises={allExercises}
        onSelect={(workout) => {
          if (pickerDayKey !== null) handleAddWorkout(workout, pickerDayKey);
        }}
        onCreateNew={() => {
          if (pickerDayKey !== null) handleCreateNew(pickerDayKey);
        }}
        onClose={() => setPickerDayKey(null)}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  nameInput: {
    marginHorizontal: spacing.m,
    marginTop: spacing.m,
    marginBottom: spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
    paddingBottom: spacing.s,
  },
  activeRow: {
    marginHorizontal: spacing.m,
    marginBottom: spacing.l,
  },
  daysHeading: {
    marginHorizontal: spacing.m,
    marginBottom: spacing.s,
  },
  daysContainer: {
    marginBottom: spacing.l,
  },
});
