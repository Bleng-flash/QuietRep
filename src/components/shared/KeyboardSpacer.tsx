import { useGenericKeyboardHandler } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

/**
 * Zero-height while the keyboard is closed; grows to the keyboard's exact height as it opens.
 * Rendered as the last child of a scrollable, it gives the content enough tail to scroll the
 * bottom actions clear of the keyboard.
 *
 * This replaces KeyboardAvoidingView across the app. The component asked "how much of me does the
 * keyboard overlap?", which needs the view's position on the physical screen and gets it from
 * three values on three different clocks — a parent-relative onLayout frame treated as
 * screen-absolute, a window height arriving as a React state update, and a per-instance
 * heightWhenOpened seeded by a native event. Its Math.max(..., 0) clamp made every stale input
 * fail as silent under-padding. The spacer asks only "how tall is the keyboard", so it behaves
 * identically on a root-stack screen, a tab-nested one, and inside a Modal.
 *
 * useGenericKeyboardHandler, NOT useKeyboardHandler/useReanimatedKeyboardAnimation: those call
 * useResizeMode(), which sets the Activity-wide soft-input mode on mount and resets it on unmount.
 * That reset is process-wide and last-unmount-wins, so closing a modal's avoider clobbered the
 * mode a still-mounted screen depended on. Expo already writes adjustResize into the manifest, so
 * nothing needs to set it at runtime — things only need to stop unsetting it.
 */
export default function KeyboardSpacer() {
  // The library reports height as a negative offset; abs() gives the on-screen keyboard height.
  const keyboardHeight = useSharedValue(0);

  useGenericKeyboardHandler(
    {
      // onMove tracks the open/close animation frame by frame, so the spacer grows and shrinks in
      // lockstep with the keyboard rather than snapping at the end.
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

  const spacerStyle = useAnimatedStyle(() => ({ height: Math.abs(keyboardHeight.value) }));

  return <Animated.View style={spacerStyle} />;
}
