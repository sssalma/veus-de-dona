import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { COLORS, FONTS } from "../../constants";
import { useLanguage } from "../../contexts/LanguageContext";

/**
 * Peces compartides pels llistats del panell. `EstatLlista` cobreix els tres
 * estats en què es pot trobar un llistat -carregant, error, buit- i
 * `FilaLlista` dibuixa la fila.
 */

export function EstatLlista({
  loading,
  error,
  buit,
  missatgeBuit,
}: {
  loading: boolean;
  error: boolean;
  buit: boolean;
  missatgeBuit: string;
}) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <View accessibilityLabel={t("admin.loading")} style={{ padding: 28, alignItems: "center" }}>
        <ActivityIndicator size="small" color={COLORS.accent} />
      </View>
    );
  }

  if (error || buit) {
    return (
      <Text
        style={{
          fontFamily: FONTS.sans,
          fontSize: 12,
          color: COLORS.textSecondary,
          fontStyle: "italic",
          paddingHorizontal: 18,
          paddingTop: 20,
        }}
        maxFontSizeMultiplier={1.5}
      >
        {error ? t("admin.dataUnavailable") : missatgeBuit}
      </Text>
    );
  }

  return null;
}

export function FilaLlista({
  titol,
  subtitol,
  distintiu,
  onPress,
  accessibilityLabel,
}: {
  titol: string;
  subtitol?: string | null;
  /** Etiqueta curta a la dreta, per a estats com ara "inactiva". */
  distintiu?: string | null;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
        minHeight: 56,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontFamily: FONTS.sans, fontSize: 13, fontWeight: "600", color: COLORS.text }}
          maxFontSizeMultiplier={1.5}
        >
          {titol}
        </Text>
        {subtitol ? (
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: 12,
              color: COLORS.textSecondary,
              marginTop: 2,
            }}
            maxFontSizeMultiplier={1.4}
          >
            {subtitol}
          </Text>
        ) : null}
      </View>

      {distintiu ? (
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 10,
            backgroundColor: COLORS.likeBg,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: 10,
              fontWeight: "700",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: COLORS.love,
            }}
            maxFontSizeMultiplier={1.3}
          >
            {distintiu}
          </Text>
        </View>
      ) : null}

      <Text
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={{ fontFamily: FONTS.sans, fontSize: 15, color: COLORS.controlBorder }}
        maxFontSizeMultiplier={1.3}
      >
        →
      </Text>
    </TouchableOpacity>
  );
}
