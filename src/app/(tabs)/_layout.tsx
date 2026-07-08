import WorkoutFabMenu from '@/components/session/WorkoutFabMenu';
import TabBar from '@/components/shared/TabBar';
import { Tabs } from 'expo-router';
import { useState } from 'react';

export default function TabsLayout() {
  // Owns the workout-start menu's open state here (not in TabBar) so the menu can render as a
  // sibling of <Tabs> and TabBar stays a presentational component. The center FAB toggles it open.
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  return (
    <>
      <Tabs
        tabBar={(props) => <TabBar {...props} onFabPress={() => setIsFabMenuOpen(true)} />}
        screenOptions={{ headerShown: false }}
      />

      <WorkoutFabMenu visible={isFabMenuOpen} onClose={() => setIsFabMenuOpen(false)} />
    </>
  );
}
