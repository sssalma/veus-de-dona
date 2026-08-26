import { Text, TouchableOpacity } from "react-native";
import { COLORS, FONTS } from "../../constants";
import { useLanguage } from "../../contexts/LanguageContext";

/** Botó de desar compartit per les pantalles d'edició del panell. */
export function BotoDesar({ desant, onPress }: { desant: boolean; onPress: () => void }) {
  const { t } = useLanguage();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={t("admin.save")}
      accessibilityState={{ disabled: desant, busy: desant }}
      onPress={onPress}
      disabled={desant}
      style={{
        backgroundColor: COLORS.darkBg,
        paddingVertical: 13,
        borderRadius: 8,
        marginTop: 10,
        opacity: desant ? 0.55 : 1,
        minHeight: 48,
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontFamily: FONTS.sans,
          fontSize: 13,
          fontWeight: "600",
          color: COLORS.bg,
          textAlign: "center",
        }}
        maxFontSizeMultiplier={1.4}
      >
        {desant ? t("admin.saving") : t("admin.save")}
      </Text>
    </TouchableOpacity>
  );
}
