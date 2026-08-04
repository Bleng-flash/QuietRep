import ElapsedTimer from '@/components/session/ElapsedTimer';
import { useTheme } from '@/context/ThemeContext';
import { COMPACT_INPUT_MIN_HEIGHT, spacing } from '@/styles';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SessionHeaderProps {
  name: string;
  startedAt: string;
  onNameChange: (name: string) => void;
  onMinimise: () => void;
  onFinish: () => void;
  isFinishing: boolean;
}

// Session-specific top bar: left "minimise" (leaves the session live and pops back to the tabs),
// a centred editable title with the live elapsed timer below it, and a primary "Finish".
// Discard lives in the session footer, not here (see WorkoutSession).
export default function SessionHeader({
  name,
  startedAt,
  onNameChange,
  onMinimise,
  onFinish,
  isFinishing,
}: SessionHeaderProps) {
  const { colors, layout, typography } = useTheme();
  const insets = useSafeAreaInsets();

  // Local text buffer (same local-state + callback pattern as PlannedSetRow) — the child owns the raw
  // string; the parent receives every keystroke via onNameChange and persists it (debounced).
  const [nameText, setNameText] = useState(name);

  return (
    <View style={[layout.rowBetween, layout.topBar, { paddingTop: insets.top + spacing.s }]}>
      {/* Minimise: pops back to the tabs while the session keeps running (banner picks it up).*/}
      <Pressable
        onPress={onMinimise}
        hitSlop={8}
        style={({ pressed }) => [pressed && layout.pressedButton]}
      >
        <MaterialIcons name="close-fullscreen" size={24} color={colors.textSubtle} />
      </Pressable>

      {/* Centre column: tap-to-rename title (reads as an editable heading) with the live
          elapsed timer as a subtitle beneath it. */}
      <View style={styles.centerColumn}>
        <TextInput
          style={[typography.subheading, styles.nameInput]}
          value={nameText}
          onChangeText={(text) => {
            setNameText(text);
            onNameChange(text);
          }}
          placeholder="Workout name"
          placeholderTextColor={colors.textDisabled}
          returnKeyType="done"
          maxLength={60}
        />
        <ElapsedTimer startedAt={startedAt} />
      </View>

      <Pressable
        onPress={onFinish}
        disabled={isFinishing}
        hitSlop={8}
        style={({ pressed }) => [pressed && layout.pressedButton]}
      >
        {isFinishing ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={typography.actionPrimary}>Finish</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centerColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.s,
  },
  // The compact height floor gives the title line room to be taller than RN measured it, which is
  // what keeps it from being clipped on devices with a substituted UI font (see spacing.ts). This
  // input has no padding of its own to convert, so it is the one field the floor grows.
  nameInput: {
    alignSelf: 'stretch',
    textAlign: 'center',
    minHeight: COMPACT_INPUT_MIN_HEIGHT,
    textAlignVertical: 'center',
  },
});
