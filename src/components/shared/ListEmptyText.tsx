import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/styles';
import { StyleSheet, Text } from 'react-native';

interface ListEmptyTextProps {
  message: string;
}

export default function ListEmptyText({ message }: ListEmptyTextProps) {
  const { typography } = useTheme();
  return <Text style={[typography.caption, styles.text]}>{message}</Text>;
}

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
