import SegmentedControl from '@/components/shared/SegmentedControl';
import { useTheme } from '@/context/ThemeContext';
import { spacing, type ThemeMode } from '@/styles';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The two modes the Appearance control switches between; keys are the ThemeMode union so the
// generic SegmentedControl pins its value/onChange to it and setMode can be passed straight in.
const THEME_OPTIONS: { key: ThemeMode; label: string }[] = [
  { key: 'dark', label: 'Dark' },
  { key: 'light', label: 'Light' },
];

// Profile / Settings tab. Scaffolded in Iteration 5 Step 1 with the Appearance (theme) control;
// units, bodyweight, and data export sections land in later steps.
export default function ProfileScreen() {
  const { mode, setMode, layout, typography } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={layout.screen}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.s,
        paddingHorizontal: spacing.m,
        paddingBottom: spacing.xxl,
      }}
    >
      <Text style={[typography.heading, styles.title]}>Profile</Text>

      {/* Appearance — switches the entire app between dark and light at once (persisted). */}
      <View style={styles.section}>
        <Text style={[typography.caption, styles.sectionLabel]}>Appearance</Text>
        <SegmentedControl options={THEME_OPTIONS} value={mode} onChange={setMode} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.l,
  },
  section: {
    gap: spacing.s,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
