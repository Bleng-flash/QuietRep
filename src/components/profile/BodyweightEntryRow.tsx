import { useTheme } from '@/context/ThemeContext';
import { useUnit } from '@/context/UnitContext';
import type { WeightUnit } from '@/types';
import { formatSessionDate } from '@/utils/datetime';
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

// Primitive props (not the whole BodyweightEntry) so memo bails out of re-render for unchanged rows
// when the screen reloads a fresh array on focus. Calls useUnit() itself for the current display
// unit and converts inside the card, mirroring the History cards.
const BodyweightEntryRow = memo(function BodyweightEntryRow({
  id,
  weight,
  loggedUnit,
  recordedAt,
  onDelete,
}: BodyweightEntryRowProps) {
  const { colors, layout, typography } = useTheme();
  const { unit: displayUnit } = useUnit();

  return (
    <View style={[layout.card, layout.rowBetween]}>
      <View style={styles.info}>
        <Text style={typography.subheading}>
          {formatWeight(weight, loggedUnit, displayUnit)} {displayUnit}
        </Text>
        <Text style={typography.caption}>{formatSessionDate(recordedAt)}</Text>
      </View>

      <Pressable
        onPress={() => onDelete(id)}
        hitSlop={8}
        style={({ pressed }) => pressed && layout.pressedButton}
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </Pressable>
    </View>
  );
});

export default BodyweightEntryRow;

const styles = StyleSheet.create({
  info: {
    gap: 2,
  },
});
