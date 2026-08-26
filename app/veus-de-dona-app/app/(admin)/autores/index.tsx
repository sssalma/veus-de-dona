import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS } from "../../../constants";
import { getAutores } from "../../../services/autores";
import { Autora } from "../../../types";

export default function AdminAutores() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [autores, setAutores] = useState<Autora[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getAutores()
        .then(setAutores)
        .catch(() => setAutores([]))
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
          Autores
        </Text>
      </View>

      {loading ? (
        <View accessibilityLabel="Carregant autores" style={{ padding: 24, alignItems: "center" }}>
          <ActivityIndicator size="small" color={COLORS.darkBg} />
        </View>
      ) : (
        <View style={{ padding: 14, gap: 8 }}>
          {autores.map((a) => (
            <TouchableOpacity
              key={a.id}
              accessibilityRole="button"
              accessibilityLabel={`Editar autora: ${a.nom} ${a.cognom}`}
              onPress={() => router.push(`/(admin)/autores/${a.id}`)}
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
                {a.nom} {a.cognom}
              </Text>
              {a.anys_vida && (
                <Text
                  style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary, marginTop: 2 }}
                  maxFontSizeMultiplier={1.4}
                >
                  {a.anys_vida}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
