import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS } from "../../../constants";
import { getAutora, updateAutora } from "../../../services/autores";
import AdminField from "../../../components/AdminField";

export default function EditarAutora() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [desant, setDesant] = useState(false);
  const [nom, setNom] = useState("");
  const [cognom, setCognom] = useState("");
  const [anysVida, setAnysVida] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    getAutora(id)
      .then((a) => {
        setNom(a.nom);
        setCognom(a.cognom);
        setAnysVida(a.anys_vida ?? "");
        setBio(a.bio ?? "");
      })
      .catch(() => Alert.alert("Error", "No s'ha pogut carregar l'autora"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDesar = async () => {
    if (!nom.trim() || !cognom.trim()) {
      Alert.alert("Error", "El nom i el cognom son obligatoris");
      return;
    }
    setDesant(true);
    try {
      await updateAutora(id, {
        nom: nom.trim(),
        cognom: cognom.trim(),
        anys_vida: anysVida.trim() || null,
        bio: bio.trim() || null,
      });
      router.back();
    } catch {
      Alert.alert("Error", "No s'han pogut desar els canvis");
    } finally {
      setDesant(false);
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
          accessibilityLabel="Tornar a la llista d'autores"
          onPress={() => router.back()}
          style={{ marginBottom: 6, minHeight: 44, minWidth: 44, justifyContent: "center" }}
        >
          <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary }} maxFontSizeMultiplier={1.4}>
            ← Autores
          </Text>
        </TouchableOpacity>
        <Text
          accessibilityRole="header"
          style={{ fontFamily: FONTS.serif, fontSize: 16, fontWeight: "600", color: COLORS.text }}
          maxFontSizeMultiplier={1.5}
        >
          Editar autora
        </Text>
      </View>

      {loading ? (
        <View accessibilityLabel="Carregant autora" style={{ padding: 24, alignItems: "center" }}>
          <ActivityIndicator size="small" color={COLORS.darkBg} />
        </View>
      ) : (
        <View style={{ padding: 14 }}>
          <AdminField label="Nom" value={nom} onChangeText={setNom} />
          <AdminField label="Cognom" value={cognom} onChangeText={setCognom} />
          <AdminField label="Anys de vida" placeholder="1900-1980" value={anysVida} onChangeText={setAnysVida} />
          <AdminField
            label="Biografia"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={6}
            style={{ minHeight: 110, textAlignVertical: "top" }}
          />

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Desar canvis de l'autora"
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
