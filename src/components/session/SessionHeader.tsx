import { colors, layout, spacing, typography } from '@/styles';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SessionHeaderProps {
  name: string;
  onDiscard: () => void;
  onFinish: () => void;
  isFinishing: boolean;
}

// Session-specific top bar. Not reusing EditorHeader because the actions differ:
// "Discard" (destructive) and "Finish" (primary) vs. "Cancel" and "Save".
export default function SessionHeader({ name, onDiscard, onFinish, isFinishing }: SessionHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[layout.rowBetween, layout.topBar, { paddingTop: insets.top + spacing.s }]}>
      <Pressable
        onPress={onDiscard}
        hitSlop={8}
        style={({ pressed }) => [pressed && layout.pressedButton]}
      >
        <Text style={typography.actionDanger}>Discard</Text>
      </Pressable>

      <Text style={typography.subheading} numberOfLines={1}>
        {name}
      </Text>

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
