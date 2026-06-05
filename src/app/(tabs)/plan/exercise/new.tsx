import { MUSCLE_GROUPS } from '@/constants/muscleGroups';
import { addExercise } from '@/storage';
import { colors, layout, spacing, typography } from '@/styles';
import { MuscleGroup } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NewExerciseScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [exerciseName, setExerciseName] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(): Promise<void> {
    const trimmedName = exerciseName.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter an exercise name.');
      return;
    }
    if (!selectedMuscleGroup) {
      Alert.alert('Muscle group required', 'Please select a muscle group.');
      return;
    }
    setIsSaving(true);
    // addExercise already enforces no duplicate (case-insensitive) exercise names check
    const result = await addExercise({
      name: trimmedName,
      muscleGroup: selectedMuscleGroup,
      isDefault: false,
    });
    setIsSaving(false);
    // addExercise returns null and shows its own Alert if the name already exists
    if (result !== null) {
      router.back();
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[layout.rowBetween, layout.topBar, { paddingTop: insets.top + spacing.s }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => pressed && layout.pressedButton}
        >
          <Text style={typography.actionSubtle}>Cancel</Text>
        </Pressable>
        <Text style={typography.subheading}>New Exercise</Text>
        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          hitSlop={8}
          style={({ pressed }) => pressed && layout.pressedButton}
        >
          <Text style={typography.actionPrimary}>Save</Text>
        </Pressable>
      </View>

      <View style={{ padding: spacing.m, gap: spacing.xl }}>
        <View>
          <Text style={[typography.caption, { marginBottom: spacing.s }]}>Name</Text>
          <TextInput
            style={styles.textInput}
            value={exerciseName}
            onChangeText={setExerciseName}
            placeholder="e.g  Barbell Squat"
            placeholderTextColor={colors.dark.textDisabled}
            autoCorrect={false}
            autoFocus
          />
        </View>
        <View>
          <Text style={[typography.caption, { marginBottom: spacing.s }]}>Muscle Group</Text>
          <MuscleGroupDropdown selected={selectedMuscleGroup} onSelect={setSelectedMuscleGroup} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

interface MuscleGroupDropdownProps {
  selected: MuscleGroup | null;
  onSelect: (muscleGroup: MuscleGroup) => void;
}

function MuscleGroupDropdown({ selected, onSelect }: MuscleGroupDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  function handleSelect(muscleGroup: MuscleGroup): void {
    onSelect(muscleGroup);
    setIsOpen(false);
  }

  return (
    <View>
      <Pressable
        onPress={() => setIsOpen((prev) => !prev)}
        style={({ pressed }) => [styles.dropdownTrigger, pressed && layout.pressedButton]}
      >
        <Text style={[typography.body, !selected && { color: colors.dark.textDisabled }]}>
          {selected ?? 'Select muscle group…'}
        </Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.dark.textSubtle}
        />
      </Pressable>

      {isOpen && (
        <ScrollView style={styles.dropdownList} bounces={false}>
          {MUSCLE_GROUPS.map((muscleGroup) => (
            <Pressable
              key={muscleGroup}
              onPress={() => handleSelect(muscleGroup)}
              style={({ pressed }) => [
                styles.dropdownOption,
                muscleGroup === selected && styles.dropdownOptionSelected,
                pressed && layout.pressedButton,
              ]}
            >
              <Text
                style={[
                  typography.body,
                  muscleGroup === selected && { color: colors.dark.primary },
                ]}
              >
                {muscleGroup}
              </Text>
              {muscleGroup === selected && (
                <Ionicons name="checkmark" size={20} color={colors.dark.primary} />
              )}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  textInput: {
    backgroundColor: colors.dark.inputBackground,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s + 2,
    color: colors.dark.text,
    fontSize: 15,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.dark.inputBackground,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s + 2,
  },
  dropdownList: {
    marginTop: spacing.xs,
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    maxHeight: 260,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.borderSubtle,
  },
  dropdownOptionSelected: {
    backgroundColor: colors.dark.primarySubtle,
  },
});
