import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { COLORS, FONTS, ROTUL_SECCIO } from "../constants";
import { Capcalera } from "../components/Capcalera";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { getTextosPreferits } from "../services/likes";
import { getParades } from "../services/parades";
import { Parada, TextDto } from "../types";

/**
 * Els textos marcats amb "m'agrada", del més recent al més antic. Cada entrada
 * porta a la parada del text; el nom de la parada no ve amb el text, així que
 * es creua amb la llista de parades.
 */
export default function PreferitsScreen() {
  const router = useRouter();
  const { t, idioma } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [textos, setTextos] = useState<TextDto[]>([]);
  const [parades, setParades] = useState<Parada[]>([]);
  const [carregant, setCarregant] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        setCarregant(false);
        return;
      }
      setCarregant(true);
      Promise.all([getTextosPreferits(idioma), getParades()])
        .then(([t, p]) => {
          setTextos(t);
          setParades(p);
        })
        .catch(() => setTextos([]))
        .finally(() => setCarregant(false));
    }, [isAuthenticated, idioma])
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <Capcalera titol={t("perfil.myTexts")} />

      {carregant ? (
        <View style={{ paddingTop: 40, alignItems: "center" }}>
          <ActivityIndicator color={COLORS.accent} />
        </View>
      ) : !isAuthenticated ? (
        <Missatge titol={t("preferits.needsAccount")} cos={t("preferits.needsAccountBody")}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t("auth.loginButton")}
            onPress={() => router.push("/login")}
            style={{
              marginTop: 6,
              backgroundColor: COLORS.darkBg,
              borderRadius: 8,
              minHeight: 46,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 20,
            }}
          >
            <Text
              style={{ fontFamily: FONTS.sans, fontSize: 12, fontWeight: "500", color: COLORS.bg }}
              maxFontSizeMultiplier={1.4}
            >
              {t("auth.loginButton")}
            </Text>
          </TouchableOpacity>
        </Missatge>
      ) : textos.length === 0 ? (
        <Missatge titol={t("preferits.empty")} cos={t("preferits.emptyBody")} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 36 }}>
          <Text maxFontSizeMultiplier={1.5} style={[ROTUL_SECCIO, { marginBottom: 6 }]}>
            {textos.length}{" "}
            {textos.length === 1 ? t("autora.textSingular") : t("autora.textPlural")}
          </Text>

          {textos.map((text) => {
            const parada = parades.find((p) => p.id === text.parada_id);
            const autora = text.autora ? `${text.autora.nom} ${text.autora.cognom}` : null;
            const peu = [text.obra_origen, autora, parada ? `${t("autora.stop")} ${parada.ordre}` : null]
              .filter(Boolean)
              .join(" · ");

            return (
              <TouchableOpacity
                key={text.id}
                accessibilityRole="button"
                accessibilityLabel={`${text.titol}${parada ? `, ${t("autora.stop")} ${parada.ordre}` : ""}`}
                onPress={() => router.push(`/parada/${text.parada_id}`)}
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.controlBorder,
                  borderRadius: 6,
                  padding: 10,
                  marginBottom: 6,
                }}
              >
                <Text
                  maxFontSizeMultiplier={1.5}
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 11,
                    fontWeight: "500",
                    color: COLORS.text,
                  }}
                >
                  {text.titol}
                </Text>
                {peu.length > 0 && (
                  <Text
                    maxFontSizeMultiplier={1.5}
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: 10,
                      color: COLORS.textSecondary,
                      marginTop: 2,
                    }}
                  >
                    {peu}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

/** Pantalla sense llista: diu per què està buida i què fer-hi. */
function Missatge({
  titol,
  cos,
  children,
}: {
  titol: string;
  cos: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={{ paddingHorizontal: 24, paddingTop: 40, gap: 10, alignItems: "center" }}>
      <Text
        maxFontSizeMultiplier={1.5}
        style={{
          fontFamily: FONTS.serif,
          fontSize: 16,
          color: COLORS.text,
          textAlign: "center",
          lineHeight: 23,
        }}
      >
        {titol}
      </Text>
      <Text
        maxFontSizeMultiplier={1.5}
        style={{
          fontFamily: FONTS.sans,
          fontSize: 12,
          color: COLORS.textSecondary,
          textAlign: "center",
          lineHeight: 18,
        }}
      >
        {cos}
      </Text>
      {children}
    </View>
  );
}
