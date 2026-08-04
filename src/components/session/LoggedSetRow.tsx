import { useTheme } from '@/context/ThemeContext';
import {
  COMPACT_INPUT_MIN_HEIGHT,
  radius,
  SET_LABEL_COLUMN_WIDTH,
  SET_REMOVE_COLUMN_WIDTH,
  spacing,
  type Palette,
} from '@/styles';
import type { EditableLoggedSet, LoggedSet } from '@/types';
import { sanitizeReps, sanitizeWeight } from '@/utils/inputs';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface LoggedSetRowProps {
  setIndex: number;
  editableLoggedSet: EditableLoggedSet;
  isOnly: boolean;
  hasError: boolean; // when true, the row is tinted red to flag an invalid set on finish
  onChange: (updated: LoggedSet) => void;
  onRemove: () => void;
}

export default function LoggedSetRow({
  setIndex,
  editableLoggedSet,
  isOnly,
  hasError,
  onChange,
  onRemove,
}: LoggedSetRowProps) {
  const { colors, layout, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
    <View style={[layout.row, styles.row, hasError && styles.rowError]}>
      <Text style={[typography.caption, styles.label]}>Set {setIndex + 1}</Text>

      <TextInput
        style={[typography.body, layout.inputField, styles.input]}
        keyboardType="decimal-pad"
        maxLength={6}
        value={weightText}
        placeholder="0"
        placeholderTextColor={colors.textDisabled}
        onChangeText={(text) => {
          const cleaned = sanitizeWeight(text);
          setWeightText(cleaned);
          onChange({
            ...editableLoggedSet,
            weight: parseFloat(cleaned) || 0,
            reps: editableLoggedSet.reps,
          });
        }}
      />

      <TextInput
        style={[typography.body, layout.inputField, styles.input]}
        keyboardType="number-pad"
        maxLength={3}
        value={repsText}
        placeholder={repsPlaceholder}
        placeholderTextColor={colors.textDisabled}
        onChangeText={(text) => {
          const cleaned = sanitizeReps(text);
          setRepsText(cleaned);
          onChange({
            ...editableLoggedSet,
            weight: editableLoggedSet.weight,
            reps: parseInt(cleaned, 10) || 0,
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
          color={isOnly ? colors.textDisabled : colors.error}
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
      : `${targetMinReps} - ${targetMaxReps}`;
  }
  if (targetMinReps !== undefined) return String(targetMinReps);
  if (targetMaxReps !== undefined) return String(targetMaxReps);
  return '0';
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      gap: spacing.s,
      // The row is the error-highlight box, so this padding is what keeps the rowError tint off
      // the inputs' own borders — it is not row separation (the container's gap does that).
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      // Transparent border reserved so toggling the error border causes no layout shift.
      borderWidth: 1,
      borderColor: 'transparent',
      borderRadius: radius.m,
    },
    // Reddish tint flagging a set that failed validation on finish.
    rowError: {
      borderColor: colors.error,
      backgroundColor: colors.errorSubtle,
    },
    label: {
      width: SET_LABEL_COLUMN_WIDTH,
    },
    // Overrides for inputField: the compact height floor keeps these dense rows tighter than a
    // standard field without giving up the anti-clipping slack (see spacing.ts).
    input: {
      flex: 1,
      paddingHorizontal: spacing.s,
      paddingVertical: 0,
      minHeight: COMPACT_INPUT_MIN_HEIGHT,
      textAlign: 'center',
    },
    removeButton: {
      width: SET_REMOVE_COLUMN_WIDTH,
      alignItems: 'center',
    },
  });
