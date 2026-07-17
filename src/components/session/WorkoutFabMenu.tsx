import { useActiveSession } from '@/context/ActiveSessionContext';
import { getActiveSplitId, getAllExercises, getSplits, getWorkouts } from '@/storage';
import { colors, layout, radius, spacing, typography } from '@/styles';
import type { Exercise, Workout } from '@/types';
import { matchesSearchQuery } from '@/utils/search';
import { getTodayKey } from '@/utils/datetime';
import { seedSessionExercises } from '@/utils/session';
import { buildWorkoutSubtitle } from '@/utils/workout';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface WorkoutFabMenuProps {
  visible: boolean;
  onClose: () => void;
}

// Which content the single bottom sheet is showing. Swapping these (rather than stacking modals)
// keeps the picker flows inside one Modal — avoids nested-modal glitches on iOS.
type SheetView = 'menu' | 'pickToday' | 'pickWorkout';

export default function WorkoutFabMenu({ visible, onClose }: WorkoutFabMenuProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeSession, startSession } = useActiveSession();

  const [view, setView] = useState<SheetView>('menu');
  const [todayWorkouts, setTodayWorkouts] = useState<Workout[]>([]);
  const [standaloneWorkouts, setStandaloneWorkouts] = useState<Workout[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [hasActiveSplit, setHasActiveSplit] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // useEffect (not useFocusEffect) — this is a Modal component, not a navigation screen.
  // Reloads the entry-point data each time the sheet opens, and resets the view/search on close.
  useEffect(() => {
    if (!visible) {
      setView('menu');
      setSearchQuery('');
      return;
    }
    async function load() {
      const [activeSplitId, splits, workouts, exercises] = await Promise.all([
        getActiveSplitId(),
        getSplits(),
        getWorkouts(),
        getAllExercises(),
      ]);
      const today = getTodayKey();
      const activeSplit = splits.find((split) => split.id === activeSplitId) ?? null;
      const todayIds = activeSplit ? activeSplit.days[today] : [];
      const resolvedTodayWorkouts = todayIds
        .map((workoutId) => workouts.find((workout) => workout.id === workoutId))
        .filter((workout): workout is Workout => workout !== undefined);

      setHasActiveSplit(activeSplit !== null);
      setTodayWorkouts(resolvedTodayWorkouts);
      setStandaloneWorkouts(workouts.filter((workout) => workout.isStandalone));
      setAllExercises(exercises);
    }
    load();
  }, [visible]);

  const filteredStandaloneWorkouts = useMemo(
    () => standaloneWorkouts.filter((workout) => matchesSearchQuery(workout, searchQuery)),
    [standaloneWorkouts, searchQuery],
  );

  // Subtitle for the "Today's workout" option, reflecting the active split's plan for today.
  const todaySubtitle = !hasActiveSplit
    ? 'No active split'
    : todayWorkouts.length === 0
      ? 'Rest day'
      : todayWorkouts.length === 1
        ? todayWorkouts[0].name
        : `${todayWorkouts.length} workouts`;
  const isTodayDisabled = todayWorkouts.length === 0;

  async function startFromWorkout(workout: Workout) {
    await startSession(workout.name, seedSessionExercises(workout.exercises));
    onClose();
    router.push('/session');
  }

  function handleTodayOption() {
    if (todayWorkouts.length === 1) {
      startFromWorkout(todayWorkouts[0]);
    } else if (todayWorkouts.length > 1) {
      setView('pickToday');
    }
  }

  async function handleEmptyOption() {
    await startSession('Quick Workout', []);
    onClose();
    router.push('/session');
  }

  function handleResume() {
    onClose();
    router.push('/session');
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Tap the dimmed backdrop to dismiss */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Stop taps on the sheet itself from bubbling up to the backdrop */}
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.l }]}
          onPress={() => {}}
        >
          <View style={styles.grabber} />

          {activeSession ? (
            <SheetOptionRow
              icon="play"
              title={`Resume ${activeSession.name}`}
              subtitle="You have a session in progress"
              onPress={handleResume}
            />
          ) : view === 'menu' ? (
            <>
              <SheetOptionRow
                icon="today-outline"
                title="Today's workout"
                subtitle={todaySubtitle}
                disabled={isTodayDisabled}
                onPress={handleTodayOption}
              />
              <SheetOptionRow
                icon="albums-outline"
                title="From a workout"
                subtitle="Choose from your library"
                onPress={() => setView('pickWorkout')}
              />
              <SheetOptionRow
                icon="add-circle-outline"
                title="Empty session"
                subtitle="Start from scratch"
                onPress={handleEmptyOption}
              />
            </>
          ) : view === 'pickToday' ? (
            <>
              <SheetBackHeader title="Today's workouts" onBack={() => setView('menu')} />
              <ScrollView keyboardShouldPersistTaps="handled">
                {todayWorkouts.map((workout) => (
                  <WorkoutOptionRow
                    key={workout.id}
                    workout={workout}
                    allExercises={allExercises}
                    onPress={() => startFromWorkout(workout)}
                  />
                ))}
              </ScrollView>
            </>
          ) : (
            <>
              <SheetBackHeader title="Choose a workout" onBack={() => setView('menu')} />
              <View style={styles.searchBar}>
                <Ionicons name="search" size={16} color={colors.dark.textSubtle} />
                <TextInput
                  style={[typography.body, styles.searchInput]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search workouts…"
                  placeholderTextColor={colors.dark.textDisabled}
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                />
              </View>
              <ScrollView keyboardShouldPersistTaps="handled">
                {filteredStandaloneWorkouts.length === 0 ? (
                  <Text style={[typography.caption, styles.emptyText]}>No workouts found</Text>
                ) : (
                  filteredStandaloneWorkouts.map((workout) => (
                    <WorkoutOptionRow
                      key={workout.id}
                      workout={workout}
                      allExercises={allExercises}
                      onPress={() => startFromWorkout(workout)}
                    />
                  ))
                )}
              </ScrollView>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface SheetOptionRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  disabled?: boolean;
  onPress: () => void;
}

// A primary menu option: leading icon, title, and a contextual subtitle.
function SheetOptionRow({ icon, title, subtitle, disabled = false, onPress }: SheetOptionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.optionRow,
        disabled && styles.disabledRow,
        pressed && !disabled && layout.pressedCard,
      ]}
    >
      <Ionicons
        name={icon}
        size={24}
        color={disabled ? colors.dark.textDisabled : colors.dark.primary}
      />
      <View style={{ flex: 1 }}>
        <Text style={typography.subheading} numberOfLines={1}>
          {title}
        </Text>
        <Text style={typography.caption} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

interface WorkoutOptionRowProps {
  workout: Workout;
  allExercises: Exercise[];
  onPress: () => void;
}

// A workout row in the pickToday / pickWorkout lists — name + the shared exercise-count subtitle.
function WorkoutOptionRow({ workout, allExercises, onPress }: WorkoutOptionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.workoutRow, pressed && layout.pressedCard]}
    >
      <Text style={typography.body} numberOfLines={1}>
        {workout.name}
      </Text>
      <Text style={typography.caption} numberOfLines={1}>
        {buildWorkoutSubtitle(workout, allExercises)}
      </Text>
    </Pressable>
  );
}

interface SheetBackHeaderProps {
  title: string;
  onBack: () => void;
}

// Back affordance + title shown above the pickToday / pickWorkout lists.
function SheetBackHeader({ title, onBack }: SheetBackHeaderProps) {
  return (
    <View style={[layout.row, styles.backHeader]}>
      <Pressable onPress={onBack} hitSlop={8} style={({ pressed }) => [pressed && layout.pressedButton]}>
        <Ionicons name="chevron-back" size={24} color={colors.dark.textSubtle} />
      </Pressable>
      <Text style={typography.subheading}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.dark.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.dark.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.dark.border,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.s,
    maxHeight: '70%',
  },
  // Small handle hinting the sheet can be dismissed.
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.s,
    backgroundColor: colors.dark.border,
    marginBottom: spacing.m,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.s,
  },
  disabledRow: {
    opacity: 0.4,
  },
  workoutRow: {
    gap: spacing.xs,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.borderSubtle,
  },
  backHeader: {
    gap: spacing.s,
    paddingBottom: spacing.s,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    backgroundColor: colors.dark.inputBackground,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: radius.m,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    marginBottom: spacing.s,
  },
  searchInput: {
    flex: 1,
    padding: 0,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: spacing.l,
  },
});
