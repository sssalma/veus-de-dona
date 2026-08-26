import { Text } from "react-native";
import { ROTUL_SECCIO } from "../constants";

/**
 * Rètol que encapçala una secció dins d'una pantalla.
 *
 * Estava escrit tres vegades -al perfil, a l'entrada del panell i a les
 * mètriques- amb cossos de 9 o 10 i espaiats que anaven de 0,4 a 1,2 segons el
 * fitxer. Ara tots surten de `ROTUL_SECCIO`.
 */
export function Rotul({ text }: { text: string }) {
  return (
    <Text accessibilityRole="header" style={ROTUL_SECCIO} maxFontSizeMultiplier={1.4}>
      {text}
    </Text>
  );
}
