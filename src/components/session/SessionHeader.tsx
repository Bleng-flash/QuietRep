import ElapsedTimer from '@/components/session/ElapsedTimer';
import { colors, layout, spacing, typography } from '@/styles';
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
  const insets = useSafeAreaInsets();

  // Local text buffer (same local-state + callback pattern as SetRow) — the child owns the raw
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
        <MaterialIcons name="close-fullscreen" size={24} color={colors.dark.textSubtle} />
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
          placeholderTextColor={colors.dark.textDisabled}
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
          <ActivityIndicator size="small" color={colors.dark.primary} />
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
  nameInput: {
    alignSelf: 'stretch',
    textAlign: 'center',
  },
});
