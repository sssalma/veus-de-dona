import { ReactNode } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS, TITOL_PANTALLA } from "../constants";
import { useLanguage } from "../contexts/LanguageContext";

/**
 * Capçalera de pantalla: fletxa de tornada i títol, a la mateixa filera.
 *
 * Cada pantalla se la dibuixava pel seu compte i cadascuna tornava enrere a la
 * seva manera: unes amb la paraula («← Enrere»), altres amb el nom del lloc
 * («← Panell»), i el títol quedava a una alçada diferent segons la pantalla.
 *
 * La fletxa sola és el que es veu; el nom accessible diu on porta, que és el
 * que necessita qui no veu la pantalla.
 */
export function Capcalera({
  titol,
  tornarA = "enrere",
  dreta,
}: {
  titol: string;
  /** Què diu l'etiqueta i on porta. Totes tornen enrere tret de "perfil". */
  tornarA?: "enrere" | "panell" | "perfil";
  /** Contingut opcional a l'extrem dret (una insígnia, per exemple). */
  dreta?: ReactNode;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const etiqueta =
    tornarA === "perfil"
      ? t("admin.backToProfile")
      : tornarA === "panell"
        ? t("admin.backToPanel")
        : t("common.back");

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingTop: insets.top + 8,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
      }}
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
        onPress={() => (tornarA === "perfil" ? router.replace("/(tabs)/perfil") : router.back())}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={{ width: 34, height: 44, alignItems: "flex-start", justifyContent: "center" }}
      >
        <Text
          style={{ fontFamily: FONTS.sans, fontSize: 23, color: COLORS.text, lineHeight: 28 }}
          maxFontSizeMultiplier={1.2}
        >
          ←
        </Text>
      </TouchableOpacity>

      <Text
        accessibilityRole="header"
        numberOfLines={2}
        style={[TITOL_PANTALLA, { flex: 1 }]}
        maxFontSizeMultiplier={1.3}
      >
        {titol}
      </Text>

      {dreta}
    </View>
  );
}
