import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS } from "../../../constants";
import { getText, updateText } from "../../../services/textos";
import AdminField from "../../../components/AdminField";

export default function EditarText() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [desant, setDesant] = useState(false);
  const [titol, setTitol] = useState("");
  const [obraOrigen, setObraOrigen] = useState("");
  const [contingut, setContingut] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  useEffect(() => {
    getText(id)
      .then((t) => {
        setTitol(t.titol);
        setObraOrigen(t.obra_origen ?? "");
        setContingut(t.contingut);
        setYoutubeUrl(t.youtube_url ?? "");
      })
      .catch(() => Alert.alert("Error", "No s'ha pogut carregar el text"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDesar = async () => {
    if (!titol.trim() || !contingut.trim()) {
      Alert.alert("Error", "El titol i el contingut son obligatoris");
      return;
    }
    setDesant(true);
    try {
      await updateText(id, {
        titol: titol.trim(),
        obra_origen: obraOrigen.trim() || null,
        contingut: contingut.trim(),
        youtube_url: youtubeUrl.trim() || null,
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
          accessibilityLabel="Tornar a la llista de textos"
          onPress={() => router.back()}
          style={{ marginBottom: 6, minHeight: 44, minWidth: 44, justifyContent: "center" }}
        >
          <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary }} maxFontSizeMultiplier={1.4}>
            ← Textos
          </Text>
        </TouchableOpacity>
        <Text
          accessibilityRole="header"
          style={{ fontFamily: FONTS.serif, fontSize: 16, fontWeight: "600", color: COLORS.text }}
          maxFontSizeMultiplier={1.5}
        >
          Editar text
        </Text>
      </View>

      {loading ? (
        <View accessibilityLabel="Carregant text" style={{ padding: 24, alignItems: "center" }}>
          <ActivityIndicator size="small" color={COLORS.darkBg} />
        </View>
      ) : (
        <View style={{ padding: 14 }}>
          <AdminField label="Titol" value={titol} onChangeText={setTitol} />
          <AdminField label="Obra d'origen" value={obraOrigen} onChangeText={setObraOrigen} />
          <AdminField
            label="Contingut"
            value={contingut}
            onChangeText={setContingut}
            multiline
            numberOfLines={8}
            style={{ minHeight: 140, textAlignVertical: "top" }}
          />
          <AdminField
            label="URL de YouTube"
            placeholder="https://youtube.com/watch?v=..."
            value={youtubeUrl}
            onChangeText={setYoutubeUrl}
            autoCapitalize="none"
          />

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Desar canvis del text"
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
