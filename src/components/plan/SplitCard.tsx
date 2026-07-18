import DayCircle from '@/components/plan/DayCircle';
import DayWorkoutList from '@/components/plan/DayWorkoutList';
import NamePromptModal from '@/components/shared/NamePromptModal';
import { DAY_KEYS, DAY_LABELS, DAY_NAMES } from '@/constants/days';
import {
  clearActiveSplit,
  deleteSplit,
  deleteWorkoutsByIds,
  setActiveSplit,
  updateSplit,
} from '@/storage';
import { colors, layout, spacing, typography } from '@/styles';
import type { DayKey, Exercise, Split, Workout } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

interface SplitCardProps {
  split: Split;
  isActive: boolean;
  allWorkouts: Workout[]; // every workout — used to resolve each day's embedded ids
  standaloneWorkouts: Workout[]; 
  allExercises: Exercise[];
  onChanged: () => void; // ask the owning screen to reload after a storage mutation
}

// A split rendered inline on the Plan screen. Tapping a DayCircle reveals that day's workouts
// (via DayWorkoutList) where they can be added/edited/removed. The card owns its split-level
// mutations (rename, set active, delete) directly and asks the screen to refresh via onChanged.
export default function SplitCard({
  split,
  isActive,
  allWorkouts,
  standaloneWorkouts,
  allExercises,
  onChanged,
}: SplitCardProps) {
  const [selectedDay, setSelectedDay] = useState<DayKey | null>(null);
  const [isRenameOpen, setIsRenameOpen] = useState(false);

  // Resolve embedded day-workout ids to Workout objects in O(1) per lookup.
  const workoutMap = useMemo(
    () => new Map(allWorkouts.map((workout) => [workout.id, workout])),
    [allWorkouts],
  );
  // Only standalone workouts can be assigned to a day (embedded copies belong to their own split).
  const selectedDayWorkouts = useMemo(() => {
    if (selectedDay === null) return [];
    return split.days[selectedDay]
      .map((workoutId) => workoutMap.get(workoutId))
      .filter((workout): workout is Workout => workout !== undefined); // skip dangling ids
  }, [selectedDay, split.days, workoutMap]);

  function handleDayPress(day: DayKey) {
    setSelectedDay((previousSelectedDay) => (previousSelectedDay === day ? null : day));
  }

  async function handleRename(name: string) {
    setIsRenameOpen(false);
    await updateSplit({ ...split, name });
    onChanged();
  }

  // Toggle: turning it on makes this the active split (replacing any other, since active is a
  // single storage key); turning it off clears the active split so none is active.
  async function handleToggleActive() {
    if (isActive) {
      await clearActiveSplit();
    } else {
      await setActiveSplit(split.id);
    }
    onChanged();
  }

  async function handleDeleteSplit() {
    // Cascade: the embedded workout copies are referenced only by this split, so delete them
    // first (avoids orphans) then remove the split itself.
    const embeddedWorkoutIds = DAY_KEYS.flatMap((day) => split.days[day]);
    await deleteWorkoutsByIds(embeddedWorkoutIds);
    await deleteSplit(split.id);
    onChanged();
  }

  function confirmDelete() {
    Alert.alert('Delete split?', `Delete "${split.name}" and its workouts? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: handleDeleteSplit },
    ]);
  }

  return (
    <View style={[layout.card, isActive ? styles.activeCard : styles.inactiveCard]}>
      {/* ── Header: name (tap to rename) + active toggle + delete ── */}
      <View style={layout.rowBetween}>
        <Pressable
          onPress={() => setIsRenameOpen(true)}
          hitSlop={4}
          style={({ pressed }) => [styles.nameSlot, pressed && layout.pressedButton]}
        >
          <Text style={typography.subheading} numberOfLines={1}>
            {split.name}
          </Text>
        </Pressable>

        <View style={styles.headerActions}>
          <Text style={styles.activeLabel}>Active</Text>
          <Switch
            value={isActive}
            onValueChange={handleToggleActive}
            trackColor={{ false: colors.dark.border, true: colors.dark.primaryMuted }}
            thumbColor={colors.dark.text}
            ios_backgroundColor={colors.dark.border}
          />
          <Pressable
            onPress={confirmDelete}
            hitSlop={8}
            style={({ pressed }) => [pressed && layout.pressedButton]}
          >
            <Ionicons name="trash-outline" size={18} color={colors.dark.error} />
          </Pressable>
        </View>
      </View>

      {/* ── Day circles ── */}
      <View style={styles.dayRow}>
        {DAY_KEYS.map((day) => (
          <DayCircle
            key={day}
            label={DAY_LABELS[day]}
            isSelected={selectedDay === day}
            isRest={split.days[day].length === 0}
            onPress={() => handleDayPress(day)}
          />
        ))}
      </View>

      {/* ── Expanded selected day ── */}
      {selectedDay !== null && (
        <View style={styles.expandedSection}>
          <View style={[layout.divider, styles.dividerSpacing]} />
          <Text style={styles.expandedDayLabel}>{DAY_NAMES[selectedDay]}</Text>
          <DayWorkoutList
            split={split}
            day={selectedDay}
            dayWorkouts={selectedDayWorkouts}
            standaloneWorkouts={standaloneWorkouts}
            allExercises={allExercises}
            onChanged={onChanged}
          />
        </View>
      )}

      <NamePromptModal
        visible={isRenameOpen}
        title="Rename split"
        initialValue={split.name}
        confirmLabel="Save"
        onConfirm={handleRename}
        onClose={() => setIsRenameOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Both states set the left edge explicitly. If only the active state did, de-activating would
  // leave borderLeftWidth to reset to null — and native zeroes that edge rather than falling back
  // to layout.card's borderWidth: 2, so the left border would vanish permanently.
  activeCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.dark.primary,
  },
  inactiveCard: {
    borderLeftWidth: 2,
    borderLeftColor: colors.dark.border,
  },

  // ── Header ──
  nameSlot: {
    flex: 1,
    marginRight: spacing.s,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  activeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.dark.textSubtle,
    letterSpacing: 0.4,
  },

  // ── Day row ──
  dayRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.m,
  },

  // ── Expanded section ──
  expandedSection: {
    marginTop: spacing.m,
  },
  dividerSpacing: {
    marginBottom: spacing.m,
  },
  expandedDayLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.dark.textSubtle,
    marginBottom: spacing.s,
    letterSpacing: 0.3,
  },
});
