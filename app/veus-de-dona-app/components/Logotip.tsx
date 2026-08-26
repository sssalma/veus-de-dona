import { View, Text } from "react-native";
import { APP, COLORS, FONTS } from "../constants";

/**
 * El logotip de l'aplicació: el nom en cursiva i, a sota i molt més petit,
 * «Literària».
 *
 * Va en dos pisos perquè el nom és el que s'ha de recordar i la paraula que
 * l'acota no li ha de disputar el pes. Sortia a tres pantalles copiat a mà.
 *
 * Es llegeix com un sol element: un lector de pantalla ha de dir el nom
 * sencer d'una tirada, no partit en dues línies soltes.
 */
export function Logotip({ mida = 22 }: { mida?: number }) {
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={`${APP.nom} ${APP.subtitol}`}>
      <Text
        style={{
          fontFamily: FONTS.serif,
          fontStyle: "italic",
          fontSize: mida,
          lineHeight: mida * 1.25,
          color: COLORS.text,
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
          color: COLORS.textSecondary,
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
