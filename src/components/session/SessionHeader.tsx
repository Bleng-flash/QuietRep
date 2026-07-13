import { colors, layout, spacing, typography } from '@/styles';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SessionHeaderProps {
  name: string;
  onNameChange: (name: string) => void;
  onMinimise: () => void;
  onFinish: () => void;
  isFinishing: boolean;
}

// Session-specific top bar.
// "minimise" (leaves the session live) 
// "Finish" (primary) and "Discard session" finishes the active session.
export default function SessionHeader({
  name,
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

      {/* Tap-to-rename title: a borderless centered input that reads as an editable heading. */}
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
  nameInput: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.s,
  },
});
