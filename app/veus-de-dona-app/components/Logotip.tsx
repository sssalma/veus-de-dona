import { View, Text } from "react-native";
import { APP, COLORS, FONTS } from "../constants";

/**
 * El logotip: el nom en cursiva i, a sota i més petit, «Literària».
 *
 * Es llegeix com un sol element, perquè un lector de pantalla digui el nom
 * sencer d'una tirada i no partit en dues línies.
 */
export function Logotip({
  mida = 22,
  sobreFosc = false,
}: {
  mida?: number;
  /** A la pantalla d'entrada el logotip va sobre la tinta, no sobre el paper. */
  sobreFosc?: boolean;
}) {
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={`${APP.nom} ${APP.subtitol}`}>
      <Text
        style={{
          fontFamily: FONTS.serif,
          fontStyle: "italic",
          fontSize: mida,
          lineHeight: mida * 1.25,
          color: sobreFosc ? COLORS.bg : COLORS.text,
          textAlign: "center",
        }}
        maxFontSizeMultiplier={1.3}
      >
        {APP.nom}
      </Text>
      <Text
        style={{
          fontFamily: FONTS.sans,
          fontSize: Math.max(9, Math.round(mida * 0.42)),
          fontWeight: "600",
          letterSpacing: Math.max(1.5, mida * 0.14),
          textTransform: "uppercase",
          // sobre la tinta, el cru pur cridaria mes que el nom: es baixa un pas
          color: sobreFosc ? "rgba(250,248,244,0.62)" : COLORS.textSecondary,
          textAlign: "center",
          // compensa l'espaiat, que empeny el text cap a l'esquerra
          marginLeft: Math.max(1.5, mida * 0.14),
          marginTop: 1,
        }}
        maxFontSizeMultiplier={1.2}
      >
        {APP.subtitol}
      </Text>
    </View>
  );
}
