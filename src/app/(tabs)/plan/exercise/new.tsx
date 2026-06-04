import { layout, typography } from '@/styles';
import { Text, View } from 'react-native';

export default function NewExerciseScreen() {
  return (
    <View style={layout.centered}>
      <Text style={typography.body}>New Exercise — coming soon</Text>
    </View>
  );
}
