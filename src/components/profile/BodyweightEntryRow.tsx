import { useTheme } from '@/context/ThemeContext';
import { useUnit } from '@/context/UnitContext';
import { spacing } from '@/styles';
import type { WeightUnit } from '@/types';
import { formatDateTime } from '@/utils/datetime';
import { formatWeight } from '@/utils/units';
import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface BodyweightEntryRowProps {
  id: string;
  weight: number;
  loggedUnit: WeightUnit; // the unit this entry was logged in
  recordedAt: string;
  onDelete: (id: string) => void;
}

// Compact one-line row for the entries screen: weight, recorded date + time, delete. The time is
// what disambiguates multiple same-day readings when choosing which to delete. Primitive props (not
// the whole BodyweightEntry) so memo bails out of re-render for unchanged rows when the screen
// reloads a fresh array on focus. Calls useUnit() itself for the current display unit and converts
// inside the row, mirroring the History cards. No card chrome — the parent list separates rows with
// hairline dividers, which reads better for a dense log than stacked bordered cards.
const BodyweightEntryRow = memo(function BodyweightEntryRow({
  id,
  weight,
  loggedUnit,
  recordedAt,
  onDelete,
}: BodyweightEntryRowProps) {
  const { colors, layout, typography } = useTheme();
  const { unit: displayUnit } = useUnit(); // destructuring aliasing

  return (
    <View style={[layout.row, styles.row]}>
      <Text style={[typography.label, styles.weight]}>
        {formatWeight(weight, loggedUnit, displayUnit)} {displayUnit}
      </Text>
      <Text style={[typography.caption, styles.dateTime]}>{formatDateTime(recordedAt)}</Text>

      <Pressable
        onPress={() => onDelete(id)}
        hitSlop={8}
        style={({ pressed }) => [styles.deleteButton, pressed && layout.pressedButton]}
      >
        <Ionicons name="trash-outline" size={18} color={colors.error} />
      </Pressable>
    </View>
  );
});

export default BodyweightEntryRow;

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.s + 2,
    gap: spacing.s,
  },
  // Fixed-ish weight column so the datetime captions align down the list.
  weight: {
    minWidth: 88,
  },
  // Fills the space between the weight column and the trash button, keeping captions left-aligned.
  dateTime: {
    flex: 1,
  },
  deleteButton: {
    width: 28,
    alignItems: 'center',
  },
});
