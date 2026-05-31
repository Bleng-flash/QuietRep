import { colors } from "@/styles/colors";
import { Stack } from "expo-router";

export default function PlanLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.dark.background },
      }}
    />
  );
}
