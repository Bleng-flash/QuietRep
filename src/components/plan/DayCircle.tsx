import { colors } from '@/styles';
import { Pressable, StyleSheet, Text } from 'react-native';

interface DayCircleProps {
  label: string;
  isSelected: boolean; // user has tapped this day to reveal its workouts
  isRest: boolean; // day holds zero workouts
  onPress: () => void;
}

export default function DayCircle({ label, isSelected, isRest, onPress }: DayCircleProps) {
  // isSelected gets priority visually; otherwise a rest day is a muted outline and a day with
  // workouts gets the subtle filled treatment.
  const circleStyle = isSelected ? styles.selected : isRest ? styles.rest : styles.workout;
  const labelStyle = isSelected
    ? styles.selectedLabel
    : isRest
      ? styles.restLabel
      : styles.workoutLabel;

  return (
    <Pressable onPress={onPress} hitSlop={4} style={[styles.circle, circleStyle]}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  // Circle states
  rest: {
    backgroundColor: 'transparent',
    borderColor: colors.dark.border,
  },
  workout: {
    backgroundColor: colors.dark.primarySubtle,
    borderColor: colors.dark.primaryMuted,
  },
  selected: {
    backgroundColor: colors.dark.primary,
    borderColor: colors.dark.primary,
  },

  // Label base
  label: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Label states
  restLabel: {
    color: colors.dark.textDisabled,
  },
  workoutLabel: {
    color: colors.dark.primary,
  },
  selectedLabel: {
    color: colors.dark.textInverse,
  },
});