import { colors, layout, spacing, typography } from '@/styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface SectionHeaderProps {
  title: string;
  onAdd?: () => void;
}

/** If onAdd is undefined (not passed), the entire Pressable is not rendered at all */
export default function SectionHeader({ title, onAdd }: SectionHeaderProps) {
  return (
    <View style={[layout.rowBetween, styles.container]}>
      <Text style={typography.heading}>{title}</Text>

      {onAdd && (
        <Pressable
          onPress={onAdd}
          hitSlop={8} // hitSlop expands the touchable area of a pressable beyond its visual bounds without affecting layout.
          style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.6 }]}
        >
          <MaterialCommunityIcons name="plus" size={28} color={colors.dark.primary} />
          <Text style={styles.addLabel}>Add</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.l,
    marginBottom: spacing.s,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.dark.primary,
  },
});
