import ElapsedTimer from '@/components/session/ElapsedTimer';
import { useActiveSession } from '@/context/ActiveSessionContext';
import { useTheme } from '@/context/ThemeContext';
import { spacing, type Palette } from '@/styles';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// Persistent "now-playing"-style strip, docked directly above the tab bar on every tab.
// Visible only while a session is live; a pure consumer of useActiveSession() — no storage
// of its own. Tapping it jumps straight back into the in-progress session.
export default function ResumeSessionBanner() {
  const { activeSession } = useActiveSession();
  const { colors, layout, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();

  // No live session → render nothing and occupy zero space in the tab-bar stack.
  // Hooks above run unconditionally (Rules of Hooks); this early return sits below them.
  if (!activeSession) return null;

  return (
    <Pressable
      onPress={() => router.push('/session')}
      style={({ pressed }) => [styles.banner, pressed && layout.pressedCard]}
    >
      {/* Left: accent icon + name/status. Kept left-aligned so it clears the dumbbell FAB,
          which protrudes up from the tab bar into this strip's bottom-centre. */}
      <View style={styles.leftGroup}>
        <Ionicons name="barbell" size={22} color={colors.primary} />
        <View style={styles.textGroup}>
          <Text style={typography.subheading} numberOfLines={1}>
            {activeSession.name}
          </Text>
          <ElapsedTimer startedAt={activeSession.startedAt} />
        </View>
      </View>
    </Pressable>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceRaised,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: spacing.m,
      paddingVertical: spacing.s,
    },
    leftGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.m,
      flex: 1,
    },
    // flex + minWidth:0 lets the name truncate (numberOfLines) instead of pushing the chevron off-screen
    textGroup: {
      flex: 1,
      minWidth: 0,
    },
  });
