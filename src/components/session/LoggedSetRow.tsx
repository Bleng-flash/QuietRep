import { colors, layout, spacing, typography } from '@/styles';
import type { EditableLoggedSet, LoggedSet } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface LoggedSetRowProps {
  setIndex: number;
  editableLoggedSet: EditableLoggedSet;
  isOnly: boolean;
  onChange: (updated: LoggedSet) => void;
  onRemove: () => void;
}

export default function LoggedSetRow({
  setIndex,
  editableLoggedSet,
  isOnly,
  onChange,
  onRemove,
}: LoggedSetRowProps) {
  // Text buffer pattern (same as SetRow) — local string state seeded once at mount
  // so the TextInput can display a blank field when value is 0.
  const [weightText, setWeightText] = useState(
    editableLoggedSet.weight > 0 ? String(editableLoggedSet.weight) : '',
  );
  const [repsText, setRepsText] = useState(
    editableLoggedSet.reps > 0 ? String(editableLoggedSet.reps) : '',
  );

  // Build reps placeholder from the plan's target hint (e.g. "8-12"), or fallback to "0".
  // The placeholder disappears when the user types, making it a natural "suggestion" UX.
  const repsPlaceholder = buildRepsPlaceholder(
    editableLoggedSet.targetMinReps,
    editableLoggedSet.targetMaxReps,
  );

  return (
    <View style={[layout.row, styles.row]}>
      <Text style={[typography.caption, styles.label]}>Set {setIndex + 1}</Text>

      <TextInput
        style={[typography.body, layout.inputField, styles.input]}
        keyboardType="decimal-pad"
        value={weightText}
        placeholder="0"
        placeholderTextColor={colors.dark.textDisabled}
        onChangeText={(text) => {
          setWeightText(text);
          onChange({
            ...editableLoggedSet,
            weight: parseFloat(text) || 0,
            reps: editableLoggedSet.reps,
          });
        }}
      />

      <TextInput
        style={[typography.body, layout.inputField, styles.input]}
        keyboardType="number-pad"
        value={repsText}
        placeholder={repsPlaceholder}
        placeholderTextColor={colors.dark.textDisabled}
        onChangeText={(text) => {
          setRepsText(text);
          onChange({
            ...editableLoggedSet,
            weight: editableLoggedSet.weight,
            reps: parseInt(text, 10) || 0,
          });
        }}
      />

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

function buildRepsPlaceholder(
  targetMinReps: number | undefined,
  targetMaxReps: number | undefined,
): string {
  if (targetMinReps !== undefined && targetMaxReps !== undefined) {
    return targetMinReps === targetMaxReps
      ? String(targetMinReps)
      : `${targetMinReps}-${targetMaxReps}`;
  }
  if (targetMinReps !== undefined) return String(targetMinReps);
  if (targetMaxReps !== undefined) return String(targetMaxReps);
  return '0';
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.s,
    paddingVertical: spacing.s,
  },
  label: {
    width: 48,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs + 2,
    textAlign: 'center',
  },
  removeButton: {
    width: 32,
    alignItems: 'center',
  },
});
