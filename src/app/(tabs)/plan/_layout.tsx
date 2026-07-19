import { useTheme } from '@/context/ThemeContext';
import { Stack } from 'expo-router';

export default function PlanLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
