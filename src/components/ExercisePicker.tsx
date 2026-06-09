import ListEmptyText from '@/components/ListEmptyText';
import { colors, layout, picker, radius, spacing, typography } from '@/styles';
import type { Exercise } from '@/types';
import { matchesSearchQuery } from '@/utils/exercise';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface ExercisePickerProps {
  visible: boolean;
  allExercises: Exercise[];
  alreadyAddedIds: Set<string>;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export default function ExercisePicker({
  visible,
  allExercises,
  alreadyAddedIds,
  onSelect,
  onClose,
}: ExercisePickerProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExercises = useMemo(
    () => allExercises.filter((exercise) => matchesSearchQuery(exercise, searchQuery)),
    [allExercises, searchQuery],
  );

  const handleClose = useCallback(() => {
    setSearchQuery('');
    onClose(); // set ExercisePicker to not visible
  }, [onClose]);

  // id-based — stable reference; looks up Exercise once per user tap (not per render)
  const handleSelect = useCallback((id: string) => {
    const exercise = allExercises.find((allExercise) => allExercise.id === id);
    if (exercise) {
      onSelect(exercise);
      handleClose();
    }
  }, [allExercises, onSelect, handleClose]);

  const handleCreateNew = useCallback(() => {
    handleClose();
    router.push('/plan/exercise/new');
  }, [handleClose, router]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={picker.container}>
        <View style={[layout.rowBetween, picker.header]}>
          <Text style={typography.heading}>Add Exercise</Text>
          <Pressable onPress={handleClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.dark.textSubtle} />
          </Pressable>
        </View>

        <View style={picker.searchBar}>
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

        <FlatList
          data={filteredExercises}
          keyExtractor={(exercise) => exercise.id}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          renderItem={useCallback(
            ({ item }: { item: Exercise }) => (
              <ExercisePickerItem
                exercise={item}
                isAdded={alreadyAddedIds.has(item.id)}
                onSelect={handleSelect}
              />
            ),
            [handleSelect, alreadyAddedIds],
          )}
          ListEmptyComponent={<ListEmptyText message="No exercises found" />}
          ListFooterComponent={
            <Pressable
              onPress={handleCreateNew}
              style={({ pressed }) => [picker.createButton, pressed && layout.pressedButton]}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.dark.primary} />
              <Text style={picker.createLabel}>Create new exercise</Text>
            </Pressable>
          }
        />
      </View>
    </Modal>
  );
}

interface ExercisePickerItemProps {
  exercise: Exercise;
  isAdded: boolean;
  onSelect: (id: string) => void;
}

const ExercisePickerItem = memo(function ExercisePickerItem({
  exercise,
  isAdded,
  onSelect,
}: ExercisePickerItemProps) {
  return (
    <Pressable
      onPress={() => !isAdded && onSelect(exercise.id)}
      style={({ pressed }) => [
        styles.exerciseItem,
        isAdded && { opacity: 0.4 },
        pressed && !isAdded && layout.pressedCard,
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={typography.body}>{exercise.name}</Text>
        <Text style={typography.caption}>{exercise.muscleGroup}</Text>
      </View>
      {isAdded && <Text style={styles.addedBadge}>Added</Text>}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.borderSubtle,
  },
  addedBadge: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.dark.primary,
    backgroundColor: colors.dark.primarySubtle,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: radius.s,
  },
});
