import TabBar from '@/components/shared/TabBar';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }} />

    // props is received from Expo Router, containing state. navigation, and descriptors
  );
}
