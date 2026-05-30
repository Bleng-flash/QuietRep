import { colors } from "@/styles/colors";
import { Text, View } from "react-native";

export default function ProfileScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.dark.background,
      }}
    >
      <Text style={{ color: colors.dark.text, fontSize: 28 }}>Text color.</Text>
      <Text style={{ color: colors.dark.textSubtle, fontSize: 28 }}>
        Text Subtle color
      </Text>
      <Text style={{ color: colors.dark.textDisabled, fontSize: 28 }}>
        Text Disabled color
      </Text>
      <Text style={{ color: colors.dark.primary, fontSize: 28 }}>
        Primarey color
      </Text>
      <Text style={{ color: colors.dark.primarySubtle, fontSize: 28 }}>
        Primarey subtle color
      </Text>
      <Text style={{ color: colors.dark.primaryMuted, fontSize: 28 }}>
        Primarey muted color
      </Text>

      <Text style={{ color: colors.dark.warning, fontSize: 28 }}>Warning</Text>
      <Text style={{ color: colors.dark.warningSubtle, fontSize: 28 }}>
        Warning subtle
      </Text>

      <Text style={{ color: colors.dark.error, fontSize: 28 }}>error</Text>
      <Text style={{ color: colors.dark.errorSubtle, fontSize: 28 }}>
        error subtle
      </Text>

      <Text style={{ color: colors.dark.success, fontSize: 28 }}>success</Text>
      <Text style={{ color: colors.dark.successSubtle, fontSize: 28 }}>
        successsubtle
      </Text>

      <Text style={{ color: colors.dark.overlay, fontSize: 28 }}>
        {" "}
        Overlay{" "}
      </Text>
    </View>
  );
}
