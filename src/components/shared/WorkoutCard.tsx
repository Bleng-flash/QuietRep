import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/styles';
import type { Exercise, Workout } from '@/types';
import { buildWorkoutSubtitle } from '@/utils/workout';
import { useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';

interface WorkoutCardProps {
  workout: Workout;
  allExercises: Exercise[];
  onLongPress?: () => void;
}

export default function WorkoutCard({ workout, allExercises, onLongPress }: WorkoutCardProps) {
  const { layout, typography } = useTheme();
  const router = useRouter();
  const subtitle = buildWorkoutSubtitle(workout, allExercises);

  return (
    <Pressable
      onPress={() => router.push(`/plan/workout/${workout.id}`)}
      onLongPress={onLongPress}
      delayLongPress={200}
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
