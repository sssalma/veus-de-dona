import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Switch } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS } from "../../../constants";
import { getParada, updateParada, toggleParadaActiva } from "../../../services/parades";
import AdminField from "../../../components/AdminField";

export default function EditarParada() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [desant, setDesant] = useState(false);
  const [nomEspai, setNomEspai] = useState("");
  const [activa, setActiva] = useState(true);

  useEffect(() => {
    getParada(id)
      .then((p) => {
        setNomEspai(p.nom_espai);
        setActiva(p.activa);
      })
      .catch(() => Alert.alert("Error", "No s'ha pogut carregar la parada"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDesar = async () => {
    if (!nomEspai.trim()) {
      Alert.alert("Error", "El nom de l'espai es obligatori");
      return;
    }
    setDesant(true);
    try {
      await updateParada(id, { nom_espai: nomEspai.trim() });
      router.back();
    } catch {
      Alert.alert("Error", "No s'han pogut desar els canvis");
    } finally {
      setDesant(false);
    }
  };

  const handleToggleActiva = async (valor: boolean) => {
    setActiva(valor);
    try {
      await toggleParadaActiva(id, valor);
    } catch {
      setActiva(!valor);
      Alert.alert("Error", "No s'ha pogut canviar l'estat de la parada");
    }
  };

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
          accessibilityLabel="Tornar a la llista de parades"
          onPress={() => router.back()}
          style={{ marginBottom: 6, minHeight: 44, minWidth: 44, justifyContent: "center" }}
        >
          <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary }} maxFontSizeMultiplier={1.4}>
            ← Parades
          </Text>
        </TouchableOpacity>
        <Text
          accessibilityRole="header"
          style={{ fontFamily: FONTS.serif, fontSize: 16, fontWeight: "600", color: COLORS.text }}
          maxFontSizeMultiplier={1.5}
        >
          Editar parada
        </Text>
      </View>

      {loading ? (
        <View accessibilityLabel="Carregant parada" style={{ padding: 24, alignItems: "center" }}>
          <ActivityIndicator size="small" color={COLORS.darkBg} />
        </View>
      ) : (
        <View style={{ padding: 14 }}>
          <AdminField label="Nom de l'espai" value={nomEspai} onChangeText={setNomEspai} />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 8,
              padding: 12,
              marginBottom: 14,
              minHeight: 44,
            }}
          >
            <Text style={{ fontFamily: FONTS.sans, fontSize: 11, color: COLORS.text }} maxFontSizeMultiplier={1.4}>
              Parada activa
            </Text>
            <Switch
              accessibilityLabel={activa ? "Parada activa, prem per desactivar" : "Parada inactiva, prem per activar"}
              accessibilityRole="switch"
              value={activa}
              onValueChange={handleToggleActiva}
            />
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Desar canvis de la parada"
            accessibilityState={{ disabled: desant }}
            onPress={handleDesar}
            disabled={desant}
            style={{
              backgroundColor: COLORS.darkBg,
              paddingVertical: 11,
              borderRadius: 8,
              marginTop: 6,
              opacity: desant ? 0.6 : 1,
              minHeight: 44,
              justifyContent: "center",
            }}
          >
            <Text
              style={{ fontFamily: FONTS.sans, fontSize: 11, fontWeight: "500", color: COLORS.bg, textAlign: "center" }}
              maxFontSizeMultiplier={1.4}
            >
              {desant ? "Desant..." : "Desar canvis"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
