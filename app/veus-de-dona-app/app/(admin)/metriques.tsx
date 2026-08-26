import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS } from "../../constants";
import { getMetriquesParades } from "../../services/metriques";
import { MetriquesParada } from "../../types";

// Desglossament per parada. L'endpoint GET /metriques/parades i el servei del
// client ja existien, però cap pantalla els consumia.
export default function MetriquesParades() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [parades, setParades] = useState<MetriquesParada[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getMetriquesParades()
        .then(setParades)
        .catch(() => setParades([]))
        .finally(() => setLoading(false));
    }, [])
  );

  const totalVisites = parades.reduce(
    (acc, p) => acc + Object.values(p.visites_per_mode).reduce((a, b) => a + b, 0),
    0
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View
        accessibilityRole="header"
        style={{
          paddingHorizontal: 14,
          paddingTop: insets.top + 6,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Tornar al panell"
          onPress={() => router.back()}
          style={{ marginBottom: 6, minHeight: 44, minWidth: 44, justifyContent: "center" }}
        >
          <Text
            style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary }}
            maxFontSizeMultiplier={1.4}
          >
            ← Panell
          </Text>
        </TouchableOpacity>
        <Text
          accessibilityRole="header"
          style={{ fontFamily: FONTS.serif, fontSize: 16, fontWeight: "600", color: COLORS.text }}
          maxFontSizeMultiplier={1.5}
        >
          Mètriques per parada
        </Text>
      </View>

      {loading ? (
        <View accessibilityLabel="Carregant mètriques" style={{ padding: 24, alignItems: "center" }}>
          <ActivityIndicator size="small" color={COLORS.darkBg} />
        </View>
      ) : parades.length === 0 ? (
        <Text
          accessibilityRole="text"
          style={{
            fontFamily: FONTS.sans,
            fontSize: 11,
            color: COLORS.textSecondary,
            padding: 14,
            fontStyle: "italic",
          }}
          maxFontSizeMultiplier={1.5}
        >
          Encara no hi ha dades d'ús.
        </Text>
      ) : (
        <View style={{ padding: 14, gap: 10 }}>
          <Text
            style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary }}
            maxFontSizeMultiplier={1.4}
          >
            {totalVisites} visites registrades a {parades.length} parades
          </Text>

          {parades.map((p) => {
            const visites = Object.values(p.visites_per_mode).reduce((a, b) => a + b, 0);
            const maxVisites = Math.max(
              1,
              ...parades.map((x) => Object.values(x.visites_per_mode).reduce((a, b) => a + b, 0))
            );
            return (
              <View
                key={p.parada_id}
                accessibilityLabel={`Parada ${p.ordre}, ${p.nom_espai}: ${visites} visites, ${p.likes} likes, ${p.comentaris} comentaris`}
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 8,
                  padding: 12,
                  gap: 8,
                }}
              >
                <Text
                  style={{ fontFamily: FONTS.sans, fontSize: 12, fontWeight: "600", color: COLORS.text }}
                  maxFontSizeMultiplier={1.5}
                >
                  {p.ordre}. {p.nom_espai}
                </Text>

                {/* barra proporcional a la parada més visitada */}
                <View
                  style={{
                    height: 4,
                    backgroundColor: COLORS.border,
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${(visites / maxVisites) * 100}%`,
                      backgroundColor: COLORS.accent,
                      borderRadius: 2,
                    }}
                  />
                </View>

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  <Metrica etiqueta="Visites" valor={visites} />
                  <Metrica etiqueta="Likes" valor={p.likes} />
                  <Metrica etiqueta="Comentaris" valor={p.comentaris} />
                </View>

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  {Object.entries(p.visites_per_mode).map(([mode, count]) => (
                    <Metrica key={mode} etiqueta={mode} valor={count} secundari />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function Metrica({
  etiqueta,
  valor,
  secundari = false,
}: {
  etiqueta: string;
  valor: number;
  secundari?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
      <Text
        style={{
          fontFamily: FONTS.sans,
          fontSize: secundari ? 11 : 13,
          fontWeight: "600",
          color: secundari ? COLORS.textSecondary : COLORS.accent,
        }}
        maxFontSizeMultiplier={1.4}
      >
        {valor}
      </Text>
      <Text
        style={{ fontFamily: FONTS.sans, fontSize: 9, color: COLORS.textSecondary }}
        maxFontSizeMultiplier={1.3}
      >
        {etiqueta}
      </Text>
    </View>
  );
}
