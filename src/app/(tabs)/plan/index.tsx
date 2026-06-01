import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import SectionHeader from "@/components/SectionHeader";
import SplitCard from "@/components/SplitCard";
import WorkoutCard from "@/components/WorkoutCard";
import {
  getActiveSplitId,
  getExercises,
  getSplits,
  getWorkouts,
} from "@/storage";
import { colors, layout, spacing, typography } from "@/styles";
import type { Exercise, Split, Workout } from "@/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [splits, setSplits] = useState<Split[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [activeSplitId, setActiveSplitId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const [splits, workouts, exercises, activeSplitId] = await Promise.all([
          getSplits(),
          getWorkouts(),
          getExercises(),
          getActiveSplitId(),
        ]);
        setSplits(splits);
        setWorkouts(workouts);
        setExercises(exercises);
        setActiveSplitId(activeSplitId);
      }
      load();
    }, []),
  );

  return (
    <ScrollView
      style={layout.screen}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + spacing.s },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Splits ── */}
      <SectionHeader
        title="Splits"
        onAdd={() => router.push("/plan/split/new")}
      />
      {splits.length === 0 ? (
        <EmptyState message="No splits yet. Create one to get started." />
      ) : (
        <FlatList
          data={splits}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <SplitCard
              split={item}
              isActive={item.id === activeSplitId}
              workouts={workouts}
              allExercises={exercises}
              onPress={() => router.push(`/plan/split/${item.id}`)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.s }} />}
        />
      )}

      {/* ── Workouts ── */}
      <SectionHeader
        title="Workouts"
        onAdd={() => router.push("/plan/workout/new")}
      />
      {workouts.length === 0 ? (
        <EmptyState message="No workouts yet. Create one to get started." />
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <WorkoutCard
              workout={item}
              allExercises={exercises}
              onPress={() => router.push(`/plan/workout/${item.id}`)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.s }} />}
        />
      )}

      {/* ── Exercises ── */}
      <SectionHeader
        title="Exercises"
        onAdd={() => router.push("/plan/exercise/new")}
      />
      <Pressable
        style={({ pressed }) => [
          layout.card,
          layout.row,
          pressed && styles.pressed,
        ]}
        onPress={() => router.push("/plan/exercise")}
      >
        <MaterialCommunityIcons
          name="view-list-outline"
          size={20}
          color={colors.dark.text}
        />
        <Text style={[typography.body, styles.exerciseActionText]}>
          View all exercises
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={colors.dark.textSubtle}
          style={{ marginLeft: "auto" }}
        />
      </Pressable>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={typography.caption}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.m,
    // paddingTop determined at runtime due to safe inset
  },
  pressed: {
    opacity: 0.75,
  },
  exerciseActionText: {
    marginLeft: spacing.s,
  },
  emptyState: {
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.s,
  },
});
