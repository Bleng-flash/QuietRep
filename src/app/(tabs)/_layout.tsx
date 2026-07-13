import ResumeSessionBanner from '@/components/session/ResumeSessionBanner';
import WorkoutFabMenu from '@/components/session/WorkoutFabMenu';
import TabBar from '@/components/shared/TabBar';
import { Tabs } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

export default function TabsLayout() {
  // Owns the workout-start menu's open state here (not in TabBar) so the menu can render as a
  // sibling of <Tabs> and TabBar stays a presentational component. The center FAB toggles it open.
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  return (
    <>
      {/* The resume banner is stacked directly above TabBar inside the tabBar slot, so the two
          dock as one unit and React Navigation measures their combined height — screen content
          is inset clear of both. The banner renders nothing when no session is live. */}
      <Tabs
        tabBar={(props) => (
          <View>
            <ResumeSessionBanner />
            <TabBar {...props} onFabPress={() => setIsFabMenuOpen(true)} />
          </View>
        )}
        screenOptions={{ headerShown: false }}
      />

      <WorkoutFabMenu visible={isFabMenuOpen} onClose={() => setIsFabMenuOpen(false)} />
    </>
  );
}
