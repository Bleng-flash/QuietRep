import { StyleSheet } from "react-native";
import { colors } from "./colors";

export const typography = StyleSheet.create({
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.dark.text,
    letterSpacing: 0.3,
  },
  subheading: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.dark.text,
  },
  body: {
    fontSize: 15,
    fontWeight: "400",
    color: colors.dark.text,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.dark.text,
  },
  caption: {
    fontSize: 13,
    fontWeight: "400",
    color: colors.dark.textSubtle,
  },
});
