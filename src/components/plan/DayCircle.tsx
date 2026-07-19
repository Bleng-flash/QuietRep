import { useTheme } from '@/context/ThemeContext';
import { type Palette } from '@/styles';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

interface DayCircleProps {
  label: string;
  isSelected: boolean; // user has tapped this day to reveal its workouts
  isRest: boolean; // day holds zero workouts
  onPress: () => void;
}

export default function DayCircle({ label, isSelected, isRest, onPress }: DayCircleProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
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
      borderColor: colors.border,
    },
    workout: {
      backgroundColor: colors.primarySubtle,
      borderColor: colors.primaryMuted,
    },
    selected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },

    // Label base
    label: {
      fontSize: 12,
      fontWeight: '600',
    },

    // Label states
    restLabel: {
      color: colors.textDisabled,
    },
    workoutLabel: {
      color: colors.primary,
    },
    selectedLabel: {
      color: colors.textInverse,
    },
  });