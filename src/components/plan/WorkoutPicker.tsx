import PickerModal from '@/components/shared/PickerModal';
import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/styles';
import type { Exercise, Workout } from '@/types';
import { buildWorkoutSubtitle } from '@/utils/workout';
import { useCallback } from 'react';
import { Text, View } from 'react-native';

interface WorkoutPickerProps {
  visible: boolean;
  standaloneWorkouts: Workout[];
  allExercises: Exercise[];
  onSelect: (workout: Workout) => void;
  onCreateNew: () => void;
  onClose: () => void;
}

export default function WorkoutPicker({
  visible,
  standaloneWorkouts,
  allExercises,
  onSelect,
  onCreateNew,
  onClose,
}: WorkoutPickerProps) {
  const { typography } = useTheme();
  const renderWorkoutContent = useCallback(
    (workout: Workout) => (
      <View style={{ gap: spacing.xs }}>
        <Text style={typography.body} numberOfLines={1}>
          {workout.name}
        </Text>
        <Text style={typography.caption} numberOfLines={1}>
          {buildWorkoutSubtitle(workout, allExercises)}
        </Text>
      </View>
    ),
    [allExercises, typography],
  );

  return (
    <PickerModal
      visible={visible}
      title="Add Workout"
      searchPlaceholder="Search workouts…"
      emptyMessage="No workouts found"
      createLabel="Create new workout"
      items={standaloneWorkouts}
      keyExtractor={(workout) => workout.id}
      renderItemContent={renderWorkoutContent}
      onSelect={onSelect}
      onCreateNew={onCreateNew}
      onClose={onClose}
    />
  );
}
