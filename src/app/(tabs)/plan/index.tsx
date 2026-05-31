import { colors } from "@/styles/colors";
import { StyleSheet, Text, View } from "react-native";

export default function PlanScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Plan</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: colors.dark.text,
    fontSize: 18,
  },
});
