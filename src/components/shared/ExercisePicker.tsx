import PickerModal from '@/components/shared/PickerModal';
import { useTheme } from '@/context/ThemeContext';
import { radius, spacing, type Palette } from '@/styles';
import type { Exercise } from '@/types';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ExercisePickerProps {
  visible: boolean;
  allExercises: Exercise[];
  alreadyAddedIds: Set<string>;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export default function ExercisePicker({
  visible,
  allExercises,
  alreadyAddedIds,
  onSelect,
  onClose,
}: ExercisePickerProps) {
  const { colors, layout, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();

  const isExerciseDisabled = useCallback(
    (exercise: Exercise) => alreadyAddedIds.has(exercise.id),
    [alreadyAddedIds],
  );

  const handleCreateNewExercise = useCallback(() => {
    // Root-stack route so this works identically wherever the picker is used: 
    // from the Plan tab AND from the root-level live session. 
    // A tabs-nested route would orphan New Exercise on the Plan stack when pushed from the session (cross-navigator push).
    router.push('/exercise/new');
  }, [router]);

  const renderExerciseContent = useCallback(
    (exercise: Exercise, isAdded: boolean) => (
      <View style={[layout.row, styles.exerciseContent]}>
        <View style={{ flex: 1 }}>
          <Text style={typography.body}>{exercise.name}</Text>
          <Text style={typography.caption}>{exercise.muscleGroup}</Text>
        </View>
        {isAdded && <Text style={styles.addedBadge}>Added</Text>}
      </View>
    ),
    [layout, typography, styles],
  );

  return (
    <PickerModal
      visible={visible}
      title="Add Exercise"
      searchPlaceholder="Search exercises…"
      emptyMessage="No exercises found"
      createLabel="Create new exercise"
      items={allExercises}
      keyExtractor={(exercise) => exercise.id}
      renderItemContent={renderExerciseContent}
      isItemDisabled={isExerciseDisabled}
      onSelect={onSelect}
      onCreateNew={handleCreateNewExercise}
      onClose={onClose}
    />
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    exerciseContent: {
      flex: 1,
    },
    addedBadge: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.primary,
      backgroundColor: colors.primarySubtle,
      paddingHorizontal: spacing.s,
      paddingVertical: spacing.xs,
      borderRadius: radius.s,
    },
  });
