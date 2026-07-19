import { useTheme } from '@/context/ThemeContext';
import { radius, spacing, type Palette } from '@/styles';
import type { PlannedSet } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface PlannedSetRowProps {
  setIndex: number;
  plannedSet: PlannedSet;
  isOnly: boolean;
  hasError: boolean; // when true, the row is tinted red to flag an invalid rep range on save
  onChange: (updated: PlannedSet) => void;
  onRemove: () => void;
}

// Strip anything that isn't a digit, so the field can only ever hold a non-negative integer
// (negatives, decimals, and pasted letters are impossible by construction — not merely blocked
// by the keyboard). 
// The MAX_REPS cap and low<=high are deliberately NOT enforced here: a too-large
// number is a real value the user may want to correct, so it is surfaced as a save-time error
// (isPlannedSetValid + red highlight), like the low>high error.
function sanitizeReps(text: string): string {
  return text.replace(/\D/g, ''); // replace every character that is not a digit 0-9 with ''
}

export default function PlannedSetRow({
  setIndex,
  plannedSet,
  isOnly,
  hasError,
  onChange,
  onRemove,
}: PlannedSetRowProps) {
  const { colors, layout, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
    <View style={[layout.row, styles.row, hasError && styles.rowError]}>
      <Text style={[typography.caption, styles.label]}>Set {setIndex + 1}</Text>

      {/* Single "Rep Range" column: two positive-integer inputs joined by "to" */}
      <View style={styles.rangeGroup}>
        <TextInput
          style={[typography.body, layout.inputField, styles.input]}
          keyboardType="number-pad"
          maxLength={3}
          value={minRepsText}
          placeholder="—"
          placeholderTextColor={colors.textDisabled}
          onChangeText={(text) => {
            const cleaned = sanitizeReps(text);
            setMinRepsText(cleaned);
            onChange({ ...plannedSet, minReps: parseInt(cleaned, 10) || 0 });
          }}
        />
        <Text style={[typography.caption, styles.rangeSeparator]}>to</Text>
        <TextInput
          style={[typography.body, layout.inputField, styles.input]}
          keyboardType="number-pad"
          maxLength={3}
          value={maxRepsText}
          placeholder="—"
          placeholderTextColor={colors.textDisabled}
          onChangeText={(text) => {
            const cleaned = sanitizeReps(text);
            setMaxRepsText(cleaned);
            onChange({ ...plannedSet, maxReps: parseInt(cleaned, 10) || 0 });
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
          color={isOnly ? colors.textDisabled : colors.error}
        />
      </Pressable>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      gap: spacing.s,
      paddingVertical: spacing.s,
      paddingHorizontal: spacing.xs,
      // Transparent border reserved so toggling the error border causes no layout shift.
      borderWidth: 1,
      borderColor: 'transparent',
      borderRadius: radius.m,
    },
    // Reddish tint flagging a set whose rep range failed validation on save.
    rowError: {
      borderColor: colors.error,
      backgroundColor: colors.errorSubtle,
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
      color: colors.textSubtle,
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
