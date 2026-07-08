import { colors, layout, spacing, typography } from '@/styles';
import type { PlannedSet } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface SetRowProps {
  setIndex: number;
  plannedSet: PlannedSet;
  isOnly: boolean;
  onChange: (updated: PlannedSet) => void;
  onRemove: () => void;
}

export default function SetRow({ setIndex, plannedSet, isOnly, onChange, onRemove }: SetRowProps) {
  /** Only when React mounts a component it runs useState once to set the initial value.
   * After that, on every re-render, the state just holds whatever was
   * last set via the setter function. */
  const [minRepsText, setMinRepsText] = useState(
    plannedSet.minReps > 0 ? String(plannedSet.minReps) : '',
  );
  const [maxRepsText, setMaxRepsText] = useState(
    plannedSet.maxReps > 0 ? String(plannedSet.maxReps) : '',
  );

  return (
    <View style={[layout.row, styles.row]}>
      <Text style={[typography.caption, styles.label]}>Set {setIndex + 1}</Text>

      {/* Single "Rep Range" column: two positive-integer inputs joined by "to" */}
      <View style={styles.rangeGroup}>
        <TextInput
          style={[typography.body, layout.inputField, styles.input]}
          keyboardType="number-pad"
          value={minRepsText}
          placeholder="—"
          placeholderTextColor={colors.dark.textDisabled}
          onChangeText={(text) => {
            setMinRepsText(text);
            onChange({ ...plannedSet, minReps: parseInt(text, 10) || 0 });
          }}
        />
        <Text style={[typography.caption, styles.rangeSeparator]}>to</Text>
        <TextInput
          style={[typography.body, layout.inputField, styles.input]}
          keyboardType="number-pad"
          value={maxRepsText}
          placeholder="—"
          placeholderTextColor={colors.dark.textDisabled}
          onChangeText={(text) => {
            setMaxRepsText(text);
            onChange({ ...plannedSet, maxReps: parseInt(text, 10) || 0 });
          }}
        />
      </View>

      <Pressable
        onPress={onRemove}
        disabled={isOnly}
        hitSlop={8}
        style={({ pressed }) => [styles.removeButton, pressed && !isOnly && layout.pressedButton]}
      >
        <Ionicons
          name="remove-circle-outline"
          size={20}
          color={isOnly ? colors.dark.textDisabled : colors.dark.error}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.s,
    paddingVertical: spacing.s,
  },
  label: {
    width: 48,
  },
  // Single column holding both range inputs and the "to" separator, centered.
  rangeGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
  },
  rangeSeparator: {
    color: colors.dark.textSubtle,
  },
  removeButton: {
    width: 32,
    alignItems: 'center',
  },
  // Overrides for inputField: bounded width so both inputs + "to" fit on one line, centered text
  input: {
    width: 64,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs + 2,
    textAlign: 'center',
  },
});
