import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS } from "../../../constants";
import { getTotesLesParades } from "../../../services/parades";
import { Parada } from "../../../types";

export default function AdminParades() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [parades, setParades] = useState<Parada[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getTotesLesParades()
        .then(setParades)
        .catch(() => setParades([]))
        .finally(() => setLoading(false));
    }, [])
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
          <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary }} maxFontSizeMultiplier={1.4}>
            ← Panell
          </Text>
        </TouchableOpacity>
        <Text
          accessibilityRole="header"
          style={{ fontFamily: FONTS.serif, fontSize: 16, fontWeight: "600", color: COLORS.text }}
          maxFontSizeMultiplier={1.5}
        >
          Parades
        </Text>
      </View>

      {loading ? (
        <View accessibilityLabel="Carregant parades" style={{ padding: 24, alignItems: "center" }}>
          <ActivityIndicator size="small" color={COLORS.darkBg} />
        </View>
      ) : (
        <View style={{ padding: 14, gap: 8 }}>
          {parades.map((p) => (
            <TouchableOpacity
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={`Editar parada ${p.ordre}: ${p.nom_espai}${!p.activa ? ", inactiva" : ""}`}
              onPress={() => router.push(`/(admin)/parades/${p.id}`)}
              style={{
                borderWidth: 1,
                borderColor: COLORS.controlBorder,
                borderRadius: 8,
                padding: 12,
                minHeight: 44,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontFamily: FONTS.sans, fontSize: 12, fontWeight: "600", color: COLORS.text }} maxFontSizeMultiplier={1.5}>
                {p.ordre}. {p.nom_espai}
              </Text>
              {!p.activa && (
                <Text style={{ fontFamily: FONTS.sans, fontSize: 9, color: COLORS.love }} maxFontSizeMultiplier={1.4}>
                  Inactiva
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
