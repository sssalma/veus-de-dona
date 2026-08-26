import { Text } from "react-native";
import { ROTUL_SECCIO } from "../constants";

/** Rètol que encapçala una secció dins d'una pantalla. */
export function Rotul({ text }: { text: string }) {
  return (
    <Text accessibilityRole="header" style={ROTUL_SECCIO} maxFontSizeMultiplier={1.4}>
      {text}
    </Text>
  );
}
