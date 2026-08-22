import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Switch, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { COLORS, FONTS } from "../../../constants";
import { getParada, getParadaFoto, updateParada, updateParadaFoto, toggleParadaActiva } from "../../../services/parades";
import AdminField from "../../../components/AdminField";

export default function EditarParada() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [desant, setDesant] = useState(false);
  const [pujantFoto, setPujantFoto] = useState(false);
  const [nomEspai, setNomEspai] = useState("");
  const [activa, setActiva] = useState(true);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

  useEffect(() => {
    getParada(id)
      .then((p) => {
        setNomEspai(p.nom_espai);
        setActiva(p.activa);
      })
      .catch(() => Alert.alert("Error", "No s'ha pogut carregar la parada"))
      .finally(() => setLoading(false));
    getParadaFoto(id)
      .then(setFotoUrl)
      .catch(() => setFotoUrl(null));
  }, [id]);

  const handleCanviarFoto = async () => {
    const permis = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permis.granted) {
      Alert.alert("Error", "Cal permís per accedir a les fotos");
      return;
    }
    const resultat = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (resultat.canceled || resultat.assets.length === 0) return;

    const asset = resultat.assets[0];
    setPujantFoto(true);
    try {
      await updateParadaFoto(id, {
        uri: asset.uri,
        name: asset.fileName || "foto.jpg",
        type: asset.mimeType || "image/jpeg",
      });
      const novaUrl = await getParadaFoto(id);
      setFotoUrl(novaUrl);
    } catch {
      Alert.alert("Error", "No s'ha pogut pujar la foto");
    } finally {
      setPujantFoto(false);
    }
  };

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
          <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary, marginBottom: 6 }} maxFontSizeMultiplier={1.4}>
            Foto de l'espai
          </Text>
          <View
            style={{
              width: "100%",
              height: 160,
              borderRadius: 8,
              backgroundColor: COLORS.lightBg,
              borderWidth: 1,
              borderColor: COLORS.border,
              marginBottom: 8,
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {fotoUrl ? (
              <Image source={{ uri: fotoUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            ) : (
              <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary }}>
                Sense foto
              </Text>
            )}
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Canviar la foto de la parada"
            accessibilityState={{ disabled: pujantFoto }}
            onPress={handleCanviarFoto}
            disabled={pujantFoto}
            style={{
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 8,
              paddingVertical: 10,
              marginBottom: 14,
              minHeight: 44,
              justifyContent: "center",
              opacity: pujantFoto ? 0.6 : 1,
            }}
          >
            {pujantFoto ? (
              <ActivityIndicator size="small" color={COLORS.darkBg} />
            ) : (
              <Text style={{ fontFamily: FONTS.sans, fontSize: 11, color: COLORS.text, textAlign: "center" }} maxFontSizeMultiplier={1.4}>
                Canviar foto
              </Text>
            )}
          </TouchableOpacity>

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
