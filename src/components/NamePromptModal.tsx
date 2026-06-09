import { colors, layout, spacing, typography } from '@/styles';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

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
      {/* Tap the dimmed backdrop to dismiss */}
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Stop taps on the dialog itself from bubbling up to the backdrop */}
          <Pressable style={styles.dialog} onPress={() => {}}>
            <Text style={[typography.subheading, styles.title]}>{title}</Text>

            <TextInput
              style={styles.input}
              value={nameText}
              onChangeText={setNameText}
              placeholder="Name"
              placeholderTextColor={colors.dark.textDisabled}
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.dark.overlay,
    justifyContent: 'center',
    paddingHorizontal: spacing.l,
  },
  dialog: {
    backgroundColor: colors.dark.surfaceRaised,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.dark.border,
    padding: spacing.l,
  },
  title: {
    marginBottom: spacing.m,
  },
  input: {
    backgroundColor: colors.dark.inputBackground,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s + 2,
    color: colors.dark.text,
    fontSize: 15,
  },
  actions: {
    marginTop: spacing.l,
  },
  disabledAction: {
    color: colors.dark.textDisabled,
  },
});
