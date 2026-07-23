import SegmentedControl from '@/components/shared/SegmentedControl';
import { useActiveSession } from '@/context/ActiveSessionContext';
import { useTheme } from '@/context/ThemeContext';
import { useUnit } from '@/context/UnitContext';
import { spacing, type ThemeMode } from '@/styles';
import type { WeightUnit } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The two modes the Appearance control switches between; keys are the ThemeMode union so the
// generic SegmentedControl pins its value/onChange to it and setMode can be passed straight in.
const THEME_OPTIONS: { key: ThemeMode; label: string }[] = [
  { key: 'dark', label: 'Dark' },
  { key: 'light', label: 'Light' },
];

// App version from app.json via expo-constants; static per build, so read once at module scope.
// The fallback covers environments where expoConfig is unavailable (never in a normal build).
const APP_VERSION = Constants.expoConfig?.version ?? 'unknown';

// Same pattern as THEME_OPTIONS, keyed to the WeightUnit union.
const UNIT_OPTIONS: { key: WeightUnit; label: string }[] = [
  { key: 'kg', label: 'kg' },
  { key: 'lbs', label: 'lbs' },
];

// Profile / Settings tab. Implements Appearance (theme) control, Units, and the Bodyweight nav row.
// Data export is deferred to the backend transition.
export default function ProfileScreen() {
  const { mode, setMode, colors, layout, typography } = useTheme();
  const { unit, setUnit } = useUnit();
  const { activeSession } = useActiveSession();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Units lock for the duration of an active workout session, so every load in it is logged in one unit.
  // Only this control is disabled — the tab itself stays fully navigable.
  const isUnitLocked = activeSession !== null;

  return (
    <ScrollView
      style={layout.screen}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.s,
        paddingHorizontal: spacing.m,
        paddingBottom: spacing.xxl,
      }}
    >
      <Text style={typography.heading}>Profile</Text>

      {/* Appearance — switches the entire app between dark and light at once (persisted). */}
      <View style={styles.section}>
        <Text style={[typography.caption, styles.sectionLabel]}>Appearance</Text>
        <SegmentedControl options={THEME_OPTIONS} value={mode} onChange={setMode} />
      </View>

      {/* Units — the unit NEW loads are logged in. Not retroactive: past sessions keep the
          unit they were logged in and are converted for display. */}
      <View style={styles.section}>
        <Text style={[typography.caption, styles.sectionLabel]}>Units</Text>
        <SegmentedControl
          options={UNIT_OPTIONS}
          value={unit}
          onChange={setUnit}
          disabled={isUnitLocked}
        />
        {isUnitLocked && (
          <Text style={typography.caption}>
            You cannot change weight units during an active workout session.
          </Text>
        )}
      </View>

      {/* Bodyweight — opens the full-screen bodyweight log + progression chart. */}
      <View style={styles.section}>
        <Text style={[typography.caption, styles.sectionLabel]}>Bodyweight</Text>
        <Pressable
          onPress={() => router.push('/bodyweight')}
          style={({ pressed }) => [layout.card, layout.rowBetween, pressed && layout.pressedCard]}
        >
          <Text style={typography.subheading}>Bodyweight log</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
        </Pressable>
      </View>

      {/* About — static app metadata; a plain (non-pressable) card row. */}
      <View style={styles.section}>
        <Text style={[typography.caption, styles.sectionLabel]}>About</Text>
        <View style={[layout.card, layout.rowBetween]}>
          <Text style={typography.actionSubtle}>QuietRep Version</Text>
          <Text style={typography.caption}>{APP_VERSION}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.s,
    // Every section owns its leading gap, so the title and each section are evenly spaced.
    // RN does not collapse margins, so this must not be paired with a marginBottom above.
    marginTop: spacing.l,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
