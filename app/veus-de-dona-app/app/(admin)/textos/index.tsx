import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS } from "../../../constants";
import { getAllTextos } from "../../../services/textos";
import { TextDto } from "../../../types";

export default function AdminTextos() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [textos, setTextos] = useState<TextDto[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getAllTextos()
        .then(setTextos)
        .catch(() => setTextos([]))
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
          Textos
        </Text>
      </View>

      {loading ? (
        <View accessibilityLabel="Carregant textos" style={{ padding: 24, alignItems: "center" }}>
          <ActivityIndicator size="small" color={COLORS.darkBg} />
        </View>
      ) : (
        <View style={{ padding: 14, gap: 8 }}>
          {textos.map((t) => (
            <TouchableOpacity
              key={t.id}
              accessibilityRole="button"
              accessibilityLabel={`Editar text: ${t.titol}${t.autora ? `, de ${t.autora.nom} ${t.autora.cognom}` : ""}`}
              onPress={() => router.push(`/(admin)/textos/${t.id}`)}
              style={{
                borderWidth: 1,
                borderColor: COLORS.controlBorder,
                borderRadius: 8,
                padding: 12,
                minHeight: 44,
                justifyContent: "center",
              }}
            >
              <Text style={{ fontFamily: FONTS.sans, fontSize: 12, fontWeight: "600", color: COLORS.text }} maxFontSizeMultiplier={1.5}>
                {t.titol}
              </Text>
              <Text
                style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary, marginTop: 2 }}
                maxFontSizeMultiplier={1.4}
              >
                {t.autora ? `${t.autora.nom} ${t.autora.cognom}` : ""}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
