import { useTheme } from '@/context/ThemeContext';
import { radius, spacing, type Palette } from '@/styles';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// Generic over T — the caller's literal key union (e.g. 'byWorkout' | 'byExercise' in History) — rather than a
// bare string, so `options`, `value`, and `onChange` are all pinned to the SAME union. This makes a
// stray/typo'd key a compile error and lets a typed state setter be passed straight to `onChange`
// with no cast (a plain `(key: string) => void` would reject a `(key: T) => void` setter).
// `extends string` keeps T narrowed to string literals — valid as a React `key` and as the stored value.
interface SegmentedControlOption<T extends string> {
  key: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (key: T) => void;
}

/** Generic iOS-style segmented toggle. Kept in shared/ since it's reusable across
 *  tabs. Purely presentational — the parent owns the selected value. */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const { colors, layout, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isActive = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            style={({ pressed }) => [
              styles.segment,
              isActive && styles.segmentActive,
              pressed && layout.pressedButton,
            ]}
          >
            <Text style={isActive ? typography.label : typography.caption}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundSubtle,
      borderRadius: radius.m,
      padding: spacing.xs,
      gap: spacing.xs,
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.s,
      borderRadius: radius.s,
    },
    segmentActive: {
      backgroundColor: colors.surfaceRaised,
    },
  });
