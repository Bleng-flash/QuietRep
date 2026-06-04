import { colors } from '@/styles';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

const TABS = [
  { name: 'index', label: 'Home', icon: 'home-outline', lib: 'Ion' },
  { name: 'plan', label: 'Plan', icon: 'clipboard-edit-outline', lib: 'MCI' },
  { name: 'workout', label: null, icon: 'dumbbell', lib: 'MCI' },
  {
    name: 'log',
    label: 'Past Workouts',
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

export default function TabBar({ state, navigation }: BottomTabBarProps) {
  return (
    // outerWrapper must be positioned relative so the workout button can position absolutely against it
    <View style={styles.outerWrapper}>
      {/* --- The actual bar --- */}
      <View style={styles.bar}>
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
        onPress={() => navigation.navigate('workout')}
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
    height: 70,
    paddingBottom: Platform.OS === 'ios' ? 16 : 10,
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
