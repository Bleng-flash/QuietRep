import { MAX_WEIGHT } from '@/constants/inputLimits';
import { useTheme } from '@/context/ThemeContext';
import { useUnit } from '@/context/UnitContext';
import { addBodyweightEntry } from '@/storage';
import { spacing } from '@/styles';
import { sanitizeWeight } from '@/utils/inputs';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

// Home "Log bodyweight" card: a present-moment logging action on the "today" surface (mirroring the
// FAB for workouts). Self-contained — Home shows no bodyweight state and there is one fixed action,
// so this owns its own text buffer, reads the current unit, writes the entry, and gives save
// feedback itself (per the over-prop rule, like RecentWorkouts owning its navigation). Now-only
// logging: the entry is stamped at the present moment and is not editable afterwards.
export default function LogBodyweightCard() {
  const { colors, layout, typography } = useTheme();
  const { unit } = useUnit();

  const [weightText, setWeightText] = useState('');

  const weightValue = parseFloat(weightText);
  // Disabled-until-valid is the accidental-save guard: now-only entries can't be edited after the
  // fact, so the button must never fire on an empty, zero, or over-cap value.
  const isValid = Number.isFinite(weightValue) && weightValue > 0 && weightValue <= MAX_WEIGHT;

  async function handleLog() {
    if (!isValid) return;
    // unit is read once here, at log time, to stamp the entry — the "read the setting only at
    // creation" rule sessions follow. The stored entry is self-describing thereafter.
    await addBodyweightEntry({ weight: weightValue, unit, recordedAt: new Date().toISOString() });
    setWeightText('');
    // Logging completes the typing flow — nothing left to type — so the closing keyboard
    // reinforces "saved" alongside the haptic.
    Keyboard.dismiss();
    // Fire-and-forget feedback that the entry saved, since nothing on Home reflects it.
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  return (
    <View style={[layout.card, styles.container]}>
      <View style={styles.inputRow}>
        <TextInput
          style={[typography.body, layout.inputField, styles.input]}
          keyboardType="decimal-pad"
          maxLength={6}
          value={weightText}
          placeholder="0"
          placeholderTextColor={colors.textDisabled}
          onChangeText={(text) => setWeightText(sanitizeWeight(text))}
        />
        <Text style={[typography.label, styles.unitLabel]}>{unit}</Text>
      </View>

      <Pressable
        onPress={handleLog}
        disabled={!isValid}
        style={({ pressed }) => [
          layout.addButton,
          !isValid && layout.disabled,
          pressed && isValid && layout.pressedButton,
        ]}
      >
        <Ionicons name="add" size={20} color={colors.primary} />
        <Text style={typography.actionPrimary}>Log weight</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.m,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  input: {
    flex: 1,
    textAlign: 'center',
  },
  unitLabel: {
    width: 32,
  },
});
