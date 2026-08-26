import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { COLORS, FONTS } from "../constants";
import { useLanguage } from "../contexts/LanguageContext";
import { Logotip } from "../components/Logotip";
import { Idioma } from "../i18n/translations";

const IDIOMES: Idioma[] = ["CA", "ES", "EN"];

export default function SplashScreen() {
  const router = useRouter();
  const { idioma, canviarIdioma, t } = useLanguage();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.darkBg,
        paddingHorizontal: 24,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Logotip mida={38} sobreFosc />
      <Text
        style={{
          fontFamily: FONTS.sans,
          fontSize: 11,
          color: "rgba(250,248,244,0.55)",
          letterSpacing: 1.2,
          textTransform: "uppercase",
          textAlign: "center",
          marginTop: 14,
        }}
        maxFontSizeMultiplier={1.3}
      >
        {t("splash.subtitle")}
      </Text>

      <View accessibilityRole="radiogroup" accessibilityLabel={t("perfil.language")} style={{ flexDirection: "row", gap: 8, marginTop: 32 }}>
        {IDIOMES.map((codi) => {
          const selected = codi === idioma;
          return (
            <TouchableOpacity
              key={codi}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${t("perfil.language")} ${codi}`}
              onPress={() => canviarIdioma(codi)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: selected ? COLORS.bg : "transparent",
                borderWidth: selected ? 0 : 1,
                borderColor: "rgba(255,255,255,0.3)",
                minHeight: 32,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 10,
                  fontWeight: "500",
                  color: selected ? COLORS.darkBg : "rgba(255,255,255,0.7)",
                  letterSpacing: 0.4,
                }}
              >
                {codi}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={t("splash.cta")}
        onPress={() => router.replace("/(tabs)")}
        style={{
          marginTop: 40,
          width: "100%",
          paddingVertical: 12,
          backgroundColor: COLORS.bg,
          borderRadius: 8,
          minHeight: 44,
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.sans,
            fontSize: 11,
            fontWeight: "500",
            color: COLORS.darkBg,
            textAlign: "center",
            letterSpacing: 0.4,
          }}
        >
          {t("splash.cta")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
