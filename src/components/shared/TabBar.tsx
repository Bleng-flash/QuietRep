import { colors, spacing } from '@/styles';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = [
  { name: 'index', label: 'Home', icon: 'home-outline', lib: 'Ion' },
  { name: 'plan', label: 'Plan', icon: 'clipboard-edit-outline', lib: 'MCI' },
  { name: 'workout', label: null, icon: 'dumbbell', lib: 'MCI' },
  {
    name: 'log',
    label: 'History',
    icon: 'book-open-outline',
    lib: 'MCI',
  },
  {
    name: 'profile',
    label: 'Profile',
    icon: 'person-circle-outline',
    lib: 'Ion',
  },
];

interface TabBarProps extends BottomTabBarProps {
  // Called when the center dumbbell FAB is pressed — opens the workout-start menu.
  // Injected by (tabs)/_layout.tsx, which owns the menu's open state.
  onFabPress: () => void;
}

export default function TabBar({ state, navigation, onFabPress }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    // outerWrapper must be positioned relative so the workout button can position absolutely against it
    <View style={styles.outerWrapper}>
      {/* --- The actual bar --- */}
      {/* paddingBottom clears the device's home indicator / gesture bar — same insets.bottom +
          spacing pattern used for paddingTop on every top bar in the app, applied inline since
          useSafeAreaInsets is a runtime value and StyleSheet.create runs at module load time */}
      <View style={[styles.bar, { paddingBottom: insets.bottom + spacing.s }]}>
        {/* maps each item (tab) in the TABS array to a Pressable (except workout tab) */}
        {TABS.map((tab) => {
          const isFocused: boolean = state.routes[state.index].name === tab.name;
          const isWorkout: boolean = tab.name === 'workout';

          // Leave an empty slot in the middle for the workout button
          if (isWorkout) {
            return <View key={tab.name} style={styles.slot} />;
          }

          const color = isFocused ? colors.dark.primary : colors.dark.textSubtle;

          return (
            <Pressable
              key={tab.name}
              style={styles.slot}
              onPress={() => navigation.navigate(tab.name)}
            >
              {tab.lib === 'Ion' ? (
                <Ionicons name={tab.icon as any} size={24} color={color} />
              ) : (
                <MaterialCommunityIcons name={tab.icon as any} size={24} color={color} />
              )}
              <Text style={[styles.label, { color }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* --- Workout button: floats above the bar --- */}
      <Pressable
        style={({ pressed }) => [styles.workoutButton, pressed && styles.workoutButtonPressed]}
        onPress={onFabPress}
      >
        <MaterialCommunityIcons name="dumbbell" size={36} color={colors.dark.textInverse} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'relative', // workout button positions against this
  },

  bar: {
    flexDirection: 'row',
    backgroundColor: colors.dark.backgroundSubtle,
    borderTopWidth: 0.5,
    borderTopColor: colors.dark.border,
    minHeight: 70, // floor for the content area; paddingBottom (set inline) grows the bar past this to clear the safe area
    paddingTop: 5,
  },

  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },

  label: {
    fontSize: 12,
    fontWeight: '500',
  },

  workoutButton: {
    position: 'absolute', // lifted out of the bar's flow
    top: -20, // protrudes above the bar
    alignSelf: 'center', // centred horizontally in outerWrapper
    width: 64,
    height: 64,
    borderRadius: 32, // perfect circle
    backgroundColor: colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',

    // shadow for visual lift
    shadowColor: colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8, // Android shadow
  },

  workoutButtonPressed: {
    backgroundColor: colors.dark.primaryMuted,
    shadowOpacity: 0.2,
  },
});
