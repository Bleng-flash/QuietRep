import { colors } from '@/styles';
import { Text, View } from 'react-native';

export default function LogScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.dark.background,
      }}
    >
      <Text style={{ color: colors.dark.text, fontSize: 32 }}>log screen.</Text>
    </View>
  );
}
