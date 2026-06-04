import { layout, spacing, typography } from '@/styles';
import type { Exercise, Workout } from '@/types';
import { buildWorkoutSubtitle } from '@/utils/workout';
import { Pressable, Text } from 'react-native';

interface WorkoutCardProps {
  workout: Workout;
  allExercises: Exercise[];
  onPress: () => void; // different behaviour depending on where WorkoutCard gets pressed from
}

export default function WorkoutCard({ workout, allExercises, onPress }: WorkoutCardProps) {
  const subtitle = buildWorkoutSubtitle(workout, allExercises);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [layout.card, {marginBottom: spacing.xs}, pressed && layout.pressedCard]}
    >
      <Text style={typography.subheading} numberOfLines={1}>
        {workout.name}
      </Text>
      <Text style={[typography.caption, { marginTop: spacing.xs }]} numberOfLines={1}>
        {subtitle}
      </Text>
    </Pressable>
  );
}
