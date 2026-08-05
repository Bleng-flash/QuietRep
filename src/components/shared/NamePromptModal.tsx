import { useTheme } from '@/context/ThemeContext';
import { radius, spacing, type Palette } from '@/styles';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardProvider, useGenericKeyboardHandler } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

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
      {/* KeyboardProvider is a measurement engine, not just a context: it renders a native view
          that reads the IME inset from the window it lives in. A React Native <Modal> is a
          separate native window, so the root provider never sees this one's keyboard — hence its
          own nested provider (KC's documented workaround for RN Modal). */}
      <KeyboardProvider>
        {/* Tap the dimmed backdrop to dismiss */}
        <Pressable style={styles.overlay} onPress={onClose}>
          <KeyboardLift>
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
          </KeyboardLift>
        </Pressable>
      </KeyboardProvider>
    </Modal>
  );
}

/**
 * Lifts a vertically-centered dialog clear of the keyboard.
 *
 * A centered dialog has to MOVE, not gain scrollable tail, so this is the transform sibling of
 * KeyboardSpacer rather than a use of it. The overlay centers this view in the full window, so
 * translating up by half the keyboard height re-centers it in the space that remains above the
 * keyboard — which also leaves a comfortable gap without needing the old keyboardVerticalOffset.
 *
 * Must be a separate component: the hook has to run *below* NamePromptModal's KeyboardProvider,
 * and NamePromptModal itself renders that provider rather than sitting under it.
 *
 * useGenericKeyboardHandler for the same reason as KeyboardSpacer — the useResizeMode() variants
 * mutate the Activity-wide soft-input mode on mount and reset it on unmount.
 */
function KeyboardLift({ children }: { children: ReactNode }) {
  const keyboardHeight = useSharedValue(0);

  useGenericKeyboardHandler(
    {
      onMove: (event) => {
        'worklet';
        keyboardHeight.value = event.height;
      },
      onEnd: (event) => {
        'worklet';
        keyboardHeight.value = event.height;
      },
    },
    [],
  );

  const liftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -Math.abs(keyboardHeight.value) / 2 }],
  }));

  return <Animated.View style={liftStyle}>{children}</Animated.View>;
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
