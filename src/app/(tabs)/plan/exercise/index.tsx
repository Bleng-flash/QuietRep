import { getAllExercises } from '@/storage';
import { colors, layout, picker, spacing, typography } from '@/styles';
import { Exercise } from '@/types';
import { matchesSearchQuery } from '@/utils/exercise';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ExerciseListScreen() {
  const insets = useSafeAreaInsets();

  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExercises: Exercise[] = allExercises.filter((exercise) =>
    matchesSearchQuery(exercise, searchQuery),
  );

  useFocusEffect(
    useCallback(() => {
      async function loadExercises() {
        const exercises = await getAllExercises();
        setAllExercises(exercises);
      }
      loadExercises();
    }, []),
  );

  function handleCreateNewExercise(): void {}

  function handleDeleteExercise() {
    Alert.alert('long pressed!');
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.s, paddingHorizontal: spacing.s }}>
      <View style={{ paddingBottom: spacing.s }}>
        <Text style={typography.heading}>All Exercises</Text>
        <View style={[layout.divider, { marginTop: spacing.s, marginBottom: spacing.s }]} />
      </View>
      <View style={[picker.searchBar, { marginHorizontal: 0 }]}>
        <Ionicons name="search" size={16} color={colors.dark.textSubtle} />
        <TextInput
          style={picker.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search exercises…"
          placeholderTextColor={colors.dark.textDisabled}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        <Pressable onPress={() => {}} style={({ pressed }) => pressed && layout.pressedButton}>
          <Ionicons name="funnel-outline" size={24} color={colors.dark.textSubtle} />
        </Pressable>
      </View>
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: spacing.s,
          paddingBottom: spacing.xxl,
          gap: 0,
        }}
        renderItem={({ item }) => (
          <ExerciseEntry exercise={item} onLongPress={handleDeleteExercise} />
        )}
        // Note: the List should never be empty
        ListFooterComponent={
          <Pressable
            onPress={handleCreateNewExercise}
            style={({ pressed }) => [picker.createButton, pressed && layout.pressedButton]}
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.dark.primary} />
            <Text style={picker.createLabel}>Create new exercise</Text>
          </Pressable>
        }
      />
    </View>
  );
}

interface ExerciseEntryProps {
  exercise: Exercise;
  onLongPress: () => void;
}

function ExerciseEntry({ exercise, onLongPress }: ExerciseEntryProps) {
  return (
    <Pressable
      disabled={exercise.isDefault} // disallow deletes for DEFAULT_EXERCISES
      onLongPress={onLongPress}
      style={styles.exerciseEntry}
    >
      <Text style={typography.subheading}>{exercise.name}</Text>
      <Text style={typography.caption}>{exercise.muscleGroup}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  exerciseEntry: {
    backgroundColor: colors.dark.surface,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderRadius: 2,
    borderColor: colors.dark.border,
  },
});
