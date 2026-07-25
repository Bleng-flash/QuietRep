import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/styles';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
}

// Icon size for the illustration glyph. Not a spacing token — no value on that scale is a font/icon
// size — and this is the only consumer, so it lives here rather than in src/styles.
const EMPTY_STATE_ICON_SIZE = 56;

// Caps the message so long copy wraps into a tidy centred block instead of running edge-to-edge
// on a wide screen.
const EMPTY_STATE_MAX_WIDTH = 280;

/** A first-run empty state: a muted illustration glyph, a title, and an explanatory line. Purely
 *  informational — the action that resolves the state lives on the surrounding screen (a
 *  SectionHeader button on Plan, the FAB for sessions), never inside this block. Use this for a
 *  surface that is genuinely empty until the user creates something; use ListEmptyText for a
 *  transient "nothing matched" line (search results) or an inline hint nested inside a card. */
export default function EmptyState({ icon, title, message }: EmptyStateProps) {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={EMPTY_STATE_ICON_SIZE} color={colors.textSubtle} />
      <Text style={typography.subheading}>{title}</Text>
      <Text style={[typography.caption, styles.message]}>{message}</Text>
    </View>
  );
}

// Colour-free, so a static StyleSheet — colours come from useTheme() inline above.
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.s,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.m,
  },
  message: {
    textAlign: 'center',
    maxWidth: EMPTY_STATE_MAX_WIDTH,
  },
});
