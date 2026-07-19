import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/styles';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface EditorHeaderProps {
  title: string;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean; // required — every editor surfaces a consistent saving spinner
}

// Shared Cancel / Title / Save top bar for editor screens (WorkoutEditor, New Exercise, …).
// Owns the safe-area inset so each caller doesn't re-implement the same paddingTop convention.
export default function EditorHeader({ title, onCancel, onSave, isSaving }: EditorHeaderProps) {
  const { colors, layout, typography } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[layout.rowBetween, layout.topBar, { paddingTop: insets.top + spacing.s }]}>
      <Pressable
        onPress={onCancel}
        hitSlop={8}
        style={({ pressed }) => [pressed && layout.pressedButton]}
      >
        <Text style={typography.actionSubtle}>Cancel</Text>
      </Pressable>

      <Text style={typography.subheading}>{title}</Text>

      <Pressable
        onPress={onSave}
        disabled={isSaving}
        hitSlop={8}
        style={({ pressed }) => [pressed && layout.pressedButton]}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={typography.actionPrimary}>Save</Text>
        )}
      </Pressable>
    </View>
  );
}
