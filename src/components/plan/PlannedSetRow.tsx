import { useTheme } from '@/context/ThemeContext';
import {
  COMPACT_INPUT_MIN_HEIGHT,
  radius,
  SET_LABEL_COLUMN_WIDTH,
  SET_REMOVE_COLUMN_WIDTH,
  spacing,
  type Palette,
} from '@/styles';
import type { PlannedSet } from '@/types';
import { sanitizeReps } from '@/utils/inputs';
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
      // The row is the error-highlight box, so this padding is what keeps the rowError tint off
      // the inputs' own borders — it is not row separation (the container's gap does that).
      paddingVertical: spacing.xs,
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
      width: SET_LABEL_COLUMN_WIDTH,
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
      width: SET_REMOVE_COLUMN_WIDTH,
      alignItems: 'center',
    },
    // Overrides for inputField: bounded width so both inputs + "to" fit on one line, centered text,
    // and the compact height floor that keeps these dense rows tighter than a standard field
    // without giving up the anti-clipping slack (see COMPACT_INPUT_MIN_HEIGHT in spacing.ts).
    input: {
      width: 64,
      paddingHorizontal: spacing.s,
      paddingVertical: 0,
      minHeight: COMPACT_INPUT_MIN_HEIGHT,
      textAlign: 'center',
    },
  });
