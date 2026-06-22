import ListEmptyText from '@/components/shared/ListEmptyText';
import SectionHeader from '@/components/shared/SectionHeader';
import { MUSCLE_GROUPS } from '@/constants/muscleGroups';
import { deleteExercise, getAllExercises } from '@/storage';
import { colors, layout, picker, radius, spacing, typography } from '@/styles';
import { Exercise } from '@/types';
import { matchesSearchQuery } from '@/utils/search';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ExerciseListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // We use memoisation through memo, useMemo and useCallback to prevent repeated
  // re-rendering of the ExerciseEntry component and re-computation of values/functions
  const filteredExercises = useMemo(
    () => allExercises.filter((exercise) => matchesSearchQuery(exercise, searchQuery)),
    [allExercises, searchQuery],
  );

  // Group filtered exercises by muscle group in canonical order, skipping empty groups
  const sections = useMemo(
    () =>
      MUSCLE_GROUPS.map((muscleGroup) => ({
        title: muscleGroup,
        data: filteredExercises.filter((exercise) => exercise.muscleGroup === muscleGroup),
      })).filter((section) => section.data.length > 0),
    [filteredExercises],
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

  function handleCreateNewExercise(): void {
    router.push('/plan/exercise/new');
  }

  const handleDeleteExercise = useCallback(function handleDeleteExercise(id: string): void {
    Alert.alert('Delete exercise', 'This exercise will be removed from your library.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteExercise(id);
          const exercises = await getAllExercises();
          setAllExercises(exercises);
        },
      },
    ]);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View
        style={[
          layout.rowBetween,
          layout.topBar,
          { paddingTop: insets.top + spacing.s, marginBottom: spacing.xs },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => pressed && layout.pressedButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.dark.textSubtle} />
        </Pressable>
        <Text style={typography.heading}>All Exercises</Text>
        {/* Placeholder matches back button width to keep title visually centered */}
        <View style={{ width: 24 }} />
      </View>
      <View style={{ flex: 1, paddingHorizontal: spacing.s }}>
        <View style={[picker.searchBar, { marginHorizontal: 0, marginTop: spacing.s }]}>
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
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={useCallback(
            ({ section }: { section: { title: string; data: Exercise[] } }) => (
              <SectionHeader title={section.title} />
            ),
            [],
          )}
          renderItem={useCallback(
            ({ item }: { item: Exercise }) => (
              <ExerciseEntry exercise={item} onDelete={handleDeleteExercise} />
            ),
            [handleDeleteExercise],
          )}
          ListEmptyComponent={<ListEmptyText message="No exercises found" />}
          ListFooterComponent={
            <Pressable
              onPress={handleCreateNewExercise}
              style={({ pressed }) => [picker.createButton, pressed && layout.pressedButton]}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.dark.primary} />
              <Text style={picker.createLabel}>Create new exercise</Text>
            </Pressable>
          }
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
        />
      </View>
    </View>
  );
}

interface ExerciseEntryProps {
  exercise: Exercise;
  onDelete: (id: string) => void;
}

const ExerciseEntry = memo(function ExerciseEntry({ exercise, onDelete }: ExerciseEntryProps) {
  return (
    <View style={[layout.row, styles.exerciseEntry]}>
      <View style={{ flex: 1, paddingVertical: spacing.xs }}>
        <Text style={typography.body}>{exercise.name}</Text>
      </View>
      {/* Trash button only shown for user-created exercises; default exercises are not deletable */}
      {!exercise.isDefault && (
        <Pressable
          onPress={() => onDelete(exercise.id)}
          hitSlop={8}
          style={({ pressed }) => pressed && layout.pressedButton}
        >
          <Ionicons name="trash-outline" size={18} color={colors.dark.error} />
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  exerciseEntry: {
    backgroundColor: colors.dark.surface,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderRadius: radius.xs,
    borderColor: colors.dark.borderSubtle,
  },
});
