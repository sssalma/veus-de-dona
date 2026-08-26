import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS } from "../../../constants";
import * as ImagePicker from "expo-image-picker";
import { getAutora, updateAutora, getAutoraFoto, updateAutoraFoto } from "../../../services/autores";
import FormField from "../../../components/FormField";

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
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [pujantFoto, setPujantFoto] = useState(false);

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
    // 404 si encara no en te: es queda amb les inicials
    getAutoraFoto(id).then(setFotoUrl).catch(() => setFotoUrl(null));
  }, [id]);

  const handleCanviarFoto = async () => {
    const permis = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permis.granted) {
      Alert.alert("Error", "Cal permis per accedir a les fotos");
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
      await updateAutoraFoto(id, {
        uri: asset.uri,
        name: asset.fileName || "retrat.jpg",
        type: asset.mimeType || "image/jpeg",
      });
      setFotoUrl(await getAutoraFoto(id));
    } catch {
      Alert.alert("Error", "No s'ha pogut pujar la foto");
    } finally {
      setPujantFoto(false);
    }
  };

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
          <Text
            style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary, marginBottom: 6 }}
            maxFontSizeMultiplier={1.4}
          >
            Retrat de l'autora
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: COLORS.lightBg,
                borderWidth: 1,
                borderColor: COLORS.border,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {fotoUrl ? (
                <Image source={{ uri: fotoUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              ) : (
                <Text
                  style={{ fontFamily: FONTS.sans, fontSize: 9, color: COLORS.textSecondary }}
                  maxFontSizeMultiplier={1.3}
                >
                  Sense foto
                </Text>
              )}
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Canviar el retrat de l'autora"
              accessibilityState={{ disabled: pujantFoto, busy: pujantFoto }}
              onPress={handleCanviarFoto}
              disabled={pujantFoto}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: COLORS.controlBorder,
                borderRadius: 8,
                paddingVertical: 10,
                minHeight: 44,
                justifyContent: "center",
                opacity: pujantFoto ? 0.6 : 1,
              }}
            >
              {pujantFoto ? (
                <ActivityIndicator size="small" color={COLORS.darkBg} />
              ) : (
                <Text
                  style={{ fontFamily: FONTS.sans, fontSize: 11, color: COLORS.text, textAlign: "center" }}
                  maxFontSizeMultiplier={1.4}
                >
                  Canviar retrat
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <FormField label="Nom" value={nom} onChangeText={setNom} />
          <FormField label="Cognom" value={cognom} onChangeText={setCognom} />
          <FormField label="Anys de vida" placeholder="1900-1980" value={anysVida} onChangeText={setAnysVida} />
          <FormField
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
