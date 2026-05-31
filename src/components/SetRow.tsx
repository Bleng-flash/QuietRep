import { colors, layout, spacing, typography } from "@/styles";
import type { SetScheme } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

interface SetRowProps {
  setIndex: number;
  scheme: SetScheme;
  isOnly: boolean;
  onChange: (updated: SetScheme) => void;
  onRemove: () => void;
}

export default function SetRow({
  setIndex,
  scheme,
  isOnly,
  onChange,
  onRemove,
}: SetRowProps) {
  /** Only when React mounts a component it runs useState once to set the initial value.
   * After that, on every re-render, the state just holds whatever was
   * last set via the setter function. */
  const [repsText, setRepsText] = useState(
    scheme.reps > 0 ? String(scheme.reps) : "",
  );
  const [loadText, setLoadText] = useState(
    scheme.load > 0 ? String(scheme.load) : "",
  );

  return (
    <View style={[layout.row, styles.row]}>
      <Text style={[typography.caption, styles.label]}>Set {setIndex + 1}</Text>

      <View style={styles.fieldGroup}>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={repsText}
          placeholder="—"
          placeholderTextColor={colors.dark.textDisabled}
          onChangeText={(text) => {
            setRepsText(text);
            onChange({ ...scheme, reps: parseInt(text, 10) || 0 });
          }}
        />
      </View>

      <View style={styles.fieldGroup}>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={loadText}
          placeholder="—"
          placeholderTextColor={colors.dark.textDisabled}
          onChangeText={(text) => {
            setLoadText(text);
            onChange({ ...scheme, load: parseFloat(text) || 0 });
          }}
        />
      </View>

      <Pressable
        onPress={onRemove}
        disabled={isOnly}
        hitSlop={8}
        style={({ pressed }) => [styles.removeButton, pressed && !isOnly && { opacity: 0.5 }]}
      >
        <Ionicons
          name="remove-circle-outline"
          size={20}
          color={isOnly ? colors.dark.textDisabled : colors.dark.error}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.s,
    paddingVertical: spacing.s,
  },
  label: {
    width: 44,
  },
  fieldGroup: {
    flex: 1,
    alignItems: "center",
  },
  removeButton: {
    width: 36,
    alignItems: "center",
  },
  input: {
    width: "100%",
    backgroundColor: colors.dark.inputBackground,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs + 2,
    color: colors.dark.text,
    fontSize: 15,
    textAlign: "center",
  },
});
