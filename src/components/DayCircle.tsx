import { colors } from '@/styles';
import { Pressable, StyleSheet, Text } from 'react-native';

type DayCircleState = 'rest' | 'workout' | 'selected';

interface DayCircleProps {
  label: string;
  state: DayCircleState;
  onPress: () => void;
}

export default function DayCircle({ label, state, onPress }: DayCircleProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      style={[styles.circle, styles[state]]}
    >
      <Text style={[styles.label, styles[`${state}Label`]]}>{label}</Text>
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
