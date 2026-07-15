import { colors, spacing, typography } from '@/styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

/** Placeholder for the future "By exercise" lens — per-exercise load/rep progression + charts.
 *  Stubbed this iteration so the segmented control has both sides wired; replace when built. */
export default function ByExercisePlaceholder() {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="chart-line" size={40} color={colors.dark.textDisabled} />
      <Text style={[typography.subheading, styles.title]}>Progress by exercise</Text>
      <Text style={[typography.caption, styles.subtitle]}>
        Track your load and reps for each exercise over time. Coming soon.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.s,
  },
  title: {
    marginTop: spacing.s,
  },
  subtitle: {
    textAlign: 'center',
  },
});
