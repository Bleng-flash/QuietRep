import { useTheme } from '@/context/ThemeContext';
import { radius, spacing, type Palette } from '@/styles';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView, KeyboardProvider } from 'react-native-keyboard-controller';

interface NamePromptModalProps {
  visible: boolean;
  title: string;
  initialValue: string; // empty when creating, current name when renaming
  confirmLabel: string;
  onConfirm: (name: string) => void;
  onClose: () => void;
}

// Reusable centered name-entry dialog. Cross-platform replacement for Alert.prompt (iOS-only).
// Used for both creating and renaming a split — the child owns the raw input string and only
// the trimmed, non-empty value reaches onConfirm.
export default function NamePromptModal({
  visible,
  title,
  initialValue,
  confirmLabel,
  onConfirm,
  onClose,
}: NamePromptModalProps) {
  const { colors, layout, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [nameText, setNameText] = useState(initialValue);

  // useEffect (not useFocusEffect) — this is a component, not a navigation screen.
  // Re-seeds the field whenever the dialog opens or initialValue changes; reacting to
  // prop changes has nothing to do with navigation focus.
  useEffect(() => {
    if (visible) setNameText(initialValue);
  }, [visible, initialValue]);

  const trimmedName = nameText.trim();
  const canConfirm = trimmedName.length > 0;

  function handleConfirm() {
    if (!canConfirm) return;
    onConfirm(trimmedName);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* A React Native <Modal> is a separate native window, and the root KeyboardProvider's
          context does not cross that boundary — so KeyboardAvoidingView here needs its own
          nested KeyboardProvider to read the keyboard height and lift the centered dialog clear
          of the keyboard (KC's documented workaround for RN Modal). */}
      <KeyboardProvider>
        {/* Tap the dimmed backdrop to dismiss */}
        <Pressable style={styles.overlay} onPress={onClose}>
          {/* keyboardVerticalOffset lifts the centered dialog clear of the keyboard top so it
              isn't flush against it — a positive offset increases the applied bottom padding. */}
          <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={spacing.l}>
            {/* Stop taps on the dialog itself from bubbling up to the backdrop */}
            <Pressable style={styles.dialog} onPress={() => {}}>
              <Text style={[typography.subheading, styles.title]}>{title}</Text>

              <TextInput
                style={[typography.body, layout.inputField]}
                value={nameText}
                onChangeText={setNameText}
                placeholder="Name"
                placeholderTextColor={colors.textDisabled}
                autoFocus
                autoCorrect={false}
                returnKeyType="done"
                maxLength={60}
                onSubmitEditing={handleConfirm}
              />

              <View style={[layout.rowBetween, styles.actions]}>
                <Pressable
                  onPress={onClose}
                  hitSlop={8}
                  style={({ pressed }) => [pressed && layout.pressedButton]}
                >
                  <Text style={typography.actionSubtle}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirm}
                  disabled={!canConfirm}
                  hitSlop={8}
                  style={({ pressed }) => [pressed && layout.pressedButton]}
                >
                  <Text style={[typography.actionPrimary, !canConfirm && styles.disabledAction]}>
                    {confirmLabel}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </KeyboardProvider>
    </Modal>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      paddingHorizontal: spacing.l,
    },
    dialog: {
      backgroundColor: colors.surfaceRaised,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.l,
    },
    title: {
      marginBottom: spacing.m,
    },
    actions: {
      marginTop: spacing.l,
    },
    disabledAction: {
      color: colors.textDisabled,
    },
  });
