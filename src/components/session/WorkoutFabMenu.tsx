import { useActiveSession } from '@/context/ActiveSessionContext';
import { useTheme } from '@/context/ThemeContext';
import { getActiveSplitId, getAllExercises, getSplits, getWorkouts } from '@/storage';
import { INPUT_MIN_HEIGHT, radius, spacing, type Palette } from '@/styles';
import type { Exercise, Workout } from '@/types';
import { matchesSearchQuery } from '@/utils/search';
import { getTodayKey } from '@/utils/datetime';
import { seedSessionExercises } from '@/utils/session';
import { buildWorkoutSubtitle } from '@/utils/workout';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface WorkoutFabMenuProps {
  visible: boolean;
  onClose: () => void;
}

// Which content the single bottom sheet is showing. Swapping these (rather than stacking modals)
// keeps the picker flows inside one Modal — avoids nested-modal glitches on iOS.
type SheetView = 'menu' | 'pickToday' | 'pickWorkout';

export default function WorkoutFabMenu({ visible, onClose }: WorkoutFabMenuProps) {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
      {/* The backdrop is a SIBLING of the sheet, not its parent. A Pressable claims the touch
          start unconditionally, so wrapping the sheet in one (the usual "stop taps bubbling to
          the backdrop" idiom) leaves any ScrollView below it fighting for every gesture. As
          siblings, responder negotiation never offers a sheet touch to the backdrop at all,
          since it walks ancestors only. */}
      {/* Docks the sheet above the keyboard. The container is flex-end, so bottom padding shrinks
          its content box and the sheet re-docks to the new bottom edge, moving up as a unit with
          the search field inside it. No keyboardVerticalOffset: a bottom sheet should sit flush
          against the IME, unlike NamePromptModal's centered dialog which needs a visible gap.
          Deliberately NO nested KeyboardProvider — the root one in _layout.tsx serves this. */}
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Rendered after the backdrop, so it paints on top of it */}
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.l }]}>
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
              <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
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
                <Ionicons name="search" size={16} color={colors.textSubtle} />
                <TextInput
                  style={[typography.body, styles.searchInput]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search workouts…"
                  placeholderTextColor={colors.textDisabled}
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                />
              </View>
              <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
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
        </View>
      </KeyboardAvoidingView>
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
  const { colors, layout, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.optionRow,
        disabled && layout.disabled,
        pressed && !disabled && layout.pressedCard,
      ]}
    >
      <Ionicons
        name={icon}
        size={24}
        color={disabled ? colors.textDisabled : colors.primary}
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
  const { colors, layout, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
  const { colors, layout, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[layout.row, styles.backHeader]}>
      <Pressable onPress={onBack} hitSlop={8} style={({ pressed }) => [pressed && layout.pressedButton]}>
        <Ionicons name="chevron-back" size={24} color={colors.textSubtle} />
      </Pressable>
      <Text style={typography.subheading}>{title}</Text>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    // Holds the backdrop and the sheet as siblings; the sheet is the only in-flow child, so
    // flex-end docks it to the bottom.
    container: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    // Absolutely positioned so it covers the whole screen behind the sheet without being its
    // ancestor — see the structural comment in the JSX above.
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      borderTopWidth: 1,
      borderColor: colors.border,
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
      backgroundColor: colors.border,
      marginBottom: spacing.m,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.m,
      paddingVertical: spacing.m,
      paddingHorizontal: spacing.s,
    },
    workoutRow: {
      gap: spacing.xs,
      paddingVertical: spacing.m,
      paddingHorizontal: spacing.s,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    backHeader: {
      gap: spacing.s,
      paddingBottom: spacing.s,
    },
    // Mirrors picker.searchBar: no vertical padding, because the bar's height comes from the
    // input's own INPUT_MIN_HEIGHT floor and that floor is what keeps the field's text from being
    // clipped on devices whose UI font is taller than RN measured (see spacing.ts).
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s,
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.m,
      paddingHorizontal: spacing.m,
      paddingVertical: 0,
      marginBottom: spacing.s,
    },
    searchInput: {
      flex: 1,
      padding: 0,
      minHeight: INPUT_MIN_HEIGHT,
      textAlignVertical: 'center',
    },
    emptyText: {
      textAlign: 'center',
      paddingVertical: spacing.l,
    },
    // The height cap lives on the sheet above, not here, and RN's default flexShrink is 0
    // (web CSS defaults to 1). Without this a workout list longer than the sheet lays out at
    // its full content height, so its viewport equals its content, its scroll range is zero,
    // and it silently refuses to scroll while the sheet clips the overflow. flexShrink (not
    // flex) so a short list still hugs its content instead of stretching the sheet.
    scrollArea: {
      flexShrink: 1,
    },
  });
