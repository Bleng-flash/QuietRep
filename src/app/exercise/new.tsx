import EditorHeader from '@/components/plan/EditorHeader';
import { MUSCLE_GROUPS } from '@/constants/muscleGroups';
import { addExercise } from '@/storage';
import { colors, layout, radius, spacing, typography } from '@/styles';
import { MuscleGroup } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function NewExerciseScreen() {
  const router = useRouter();

  const [exerciseName, setExerciseName] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | null>(null);
  const [isMuscleGroupDropdownOpen, setIsMuscleGroupDropdownOpen] = useState(false);
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
      <EditorHeader
        title="New Exercise"
        onCancel={() => router.back()}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/*
        Tapping any blank area dismisses the keyboard AND closes the Muscle Group dropdown if
        it's open — the standard "click-away" convention dropdowns/menus follow across apps.
        This relies on React Native's gesture responder system: on touch-down, RN walks from
        the deepest view outward and asks each one in turn "do you want to claim this touch?"
        (onStartShouldSetResponder). Children get first refusal — Pressable and TextInput both
        answer yes, so the Name field and the dropdown (trigger + option list) claim touches on
        themselves and handle them directly, and those touches never reach this wrapper's
        onPress. Only touches that land on plain View/Text (which don't claim responder status)
        fall through to here, where both Keyboard.dismiss and the dropdown close fire.
      */}
      <Pressable
        style={{ flex: 1 }}
        onPress={() => {
          Keyboard.dismiss();
          setIsMuscleGroupDropdownOpen(false);
        }}
      >
        <View style={{ padding: spacing.m, gap: spacing.xl }}>
          <View>
            <Text style={[typography.caption, { marginBottom: spacing.s }]}>Name</Text>
            <TextInput
              style={[typography.body, layout.inputField]}
              value={exerciseName}
              onChangeText={setExerciseName}
              placeholder="e.g  Barbell Squat"
              placeholderTextColor={colors.dark.textDisabled}
              autoCorrect={false}
              autoFocus
              // Cap the name (matches NamePromptModal / SessionHeader) so it stays sane wherever
              // it flows — cards, pickers, and the remove-exercise confirm alert title.
              maxLength={60}
              // Refocusing Name is claimed by the TextInput itself (same responder-priority
              // reasoning as above), so it needs its own handler to mirror the click-away close
              onFocus={() => setIsMuscleGroupDropdownOpen(false)}
            />
          </View>
          <View>
            <Text style={[typography.caption, { marginBottom: spacing.s }]}>Muscle Group</Text>
            <MuscleGroupDropdown
              selected={selectedMuscleGroup}
              onSelect={setSelectedMuscleGroup}
              isOpen={isMuscleGroupDropdownOpen}
              onOpenChange={setIsMuscleGroupDropdownOpen}
            />
          </View>
        </View>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

interface MuscleGroupDropdownProps {
  selected: MuscleGroup | null;
  onSelect: (muscleGroup: MuscleGroup) => void;
  // isOpen lives in the parent (rather than local state) so the screen can close the dropdown
  // from outside it — tapping away or refocusing Name — mirroring the controlled selected/onSelect pair
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

function MuscleGroupDropdown({ selected, onSelect, isOpen, onOpenChange }: MuscleGroupDropdownProps) {
  function handleSelect(muscleGroup: MuscleGroup): void {
    onSelect(muscleGroup);
    onOpenChange(false);
  }

  return (
    <View>
      <Pressable
        onPress={() => {
          // Direct taps on the trigger are claimed by this Pressable, so the wrapper's
          // dismiss-on-tap-out never fires — dismiss here too so the open list isn't cramped
          Keyboard.dismiss();
          onOpenChange(!isOpen); // toggle
        }}
        style={({ pressed }) => [layout.rowBetween, layout.inputField, pressed && layout.pressedButton]}
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
                layout.rowBetween,
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
  dropdownList: {
    marginTop: spacing.xs,
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: radius.m,
    maxHeight: 260,
  },
  dropdownOption: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.borderSubtle,
  },
  dropdownOptionSelected: {
    backgroundColor: colors.dark.primarySubtle,
  },
});
