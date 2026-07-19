import { useTheme } from '@/context/ThemeContext';
import { spacing, type Palette } from '@/styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface SectionHeaderProps {
  title: string;
  onButtonPress?: () => void;
  buttonLabel?: string;
  // Drops the default top margin for a section that leads a screen (nothing sits above it),
  // so its heading aligns with the top of other tabs instead of sitting spacing.l lower.
  flushTop?: boolean;
}

/** If onButtonPress is undefined (not passed), the entire Pressable is not rendered at all */
export default function SectionHeader({
  title,
  onButtonPress,
  buttonLabel,
  flushTop = false,
}: SectionHeaderProps) {
  const { colors, layout, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[layout.rowBetween, styles.container, flushTop && styles.flushTop]}>
      <Text style={typography.heading}>{title}</Text>

      {onButtonPress && (
        <Pressable
          onPress={onButtonPress}
          hitSlop={8} // hitSlop expands the touchable area of a pressable beyond its visual bounds without affecting layout.
          style={({ pressed }) => [styles.addButton, pressed && layout.pressedButton]}
        >
          <MaterialCommunityIcons name="plus" size={28} color={colors.primary} />
          <Text style={styles.addLabel}>{buttonLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      marginTop: spacing.l,
      marginBottom: spacing.s,
    },
    flushTop: {
      marginTop: 0,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    addLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.primary,
    },
  });
