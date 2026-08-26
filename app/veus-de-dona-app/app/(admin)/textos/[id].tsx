import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS } from "../../../constants";
import * as DocumentPicker from "expo-document-picker";
import { getText, updateText } from "../../../services/textos";
import { getRecursosByText, pujarRecurs, esborrarRecurs } from "../../../services/recursos";
import { Recurs } from "../../../types";
import FormField from "../../../components/FormField";

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
  // Recursos d'audio vinculats al text. Fins ara l'API ja ho permetia
  // (POST i DELETE /recursos) pero no hi havia cap pantalla: els audios de
  // la ruta nomes es podien carregar amb l'script seed_audios.py.
  const [recursos, setRecursos] = useState<Recurs[]>([]);
  const [pujantAudio, setPujantAudio] = useState(false);

  const carregarRecursos = () => {
    getRecursosByText(id)
      .then(setRecursos)
      .catch(() => setRecursos([]));
  };

  useEffect(carregarRecursos, [id]);

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

  const handlePujarAudio = async () => {
    const resultat = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
      copyToCacheDirectory: true,
    });
    if (resultat.canceled || resultat.assets.length === 0) return;

    const fitxer = resultat.assets[0];
    setPujantAudio(true);
    try {
      await pujarRecurs(id, "AUDIO", {
        uri: fitxer.uri,
        name: fitxer.name || "audio.mp3",
        type: fitxer.mimeType || "audio/mpeg",
      });
      carregarRecursos();
    } catch {
      Alert.alert("Error", "No s'ha pogut pujar l'audio");
    } finally {
      setPujantAudio(false);
    }
  };

  const handleEsborrarRecurs = (recursId: string) => {
    Alert.alert("Esborrar audio", "Segur que vols esborrar aquest audio?", [
      { text: "Cancel·lar", style: "cancel" },
      {
        text: "Esborrar",
        style: "destructive",
        onPress: async () => {
          try {
            await esborrarRecurs(recursId);
            setRecursos((prev) => prev.filter((r) => r.id !== recursId));
          } catch {
            Alert.alert("Error", "No s'ha pogut esborrar l'audio");
          }
        },
      },
    ]);
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
          <FormField label="Titol" value={titol} onChangeText={setTitol} />
          <FormField label="Obra d'origen" value={obraOrigen} onChangeText={setObraOrigen} />
          <FormField
            label="Contingut"
            value={contingut}
            onChangeText={setContingut}
            multiline
            numberOfLines={8}
            style={{ minHeight: 140, textAlignVertical: "top" }}
          />
          <FormField
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

          <View
            style={{
              marginTop: 24,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: COLORS.border,
            }}
          >
            <Text
              accessibilityRole="header"
              style={{
                fontFamily: FONTS.sans,
                fontSize: 10,
                fontWeight: "600",
                color: COLORS.textSecondary,
                textTransform: "uppercase",
                letterSpacing: 0.4,
                marginBottom: 8,
              }}
              maxFontSizeMultiplier={1.4}
            >
              Àudio de lectura
            </Text>

            {recursos.length === 0 ? (
              <Text
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 10,
                  color: COLORS.textSecondary,
                  fontStyle: "italic",
                  marginBottom: 10,
                }}
                maxFontSizeMultiplier={1.5}
              >
                Aquest text encara no té cap àudio.
              </Text>
            ) : (
              recursos.map((r) => (
                <View
                  key={r.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 8,
                    minHeight: 44,
                  }}
                >
                  <Text
                    style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.text, flex: 1 }}
                    numberOfLines={1}
                    maxFontSizeMultiplier={1.4}
                  >
                    {r.minio_key.split("/").pop()}
                  </Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Esborrar aquest àudio"
                    onPress={() => handleEsborrarRecurs(r.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ minHeight: 32, minWidth: 32, alignItems: "center", justifyContent: "center" }}
                  >
                    <Text style={{ fontSize: 14 }}>🗑</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Pujar un àudio nou per a aquest text"
              accessibilityState={{ disabled: pujantAudio, busy: pujantAudio }}
              onPress={handlePujarAudio}
              disabled={pujantAudio}
              style={{
                borderWidth: 1,
                borderColor: COLORS.controlBorder,
                borderRadius: 8,
                paddingVertical: 10,
                minHeight: 44,
                justifyContent: "center",
                opacity: pujantAudio ? 0.6 : 1,
              }}
            >
              {pujantAudio ? (
                <ActivityIndicator size="small" color={COLORS.darkBg} />
              ) : (
                <Text
                  style={{ fontFamily: FONTS.sans, fontSize: 11, color: COLORS.text, textAlign: "center" }}
                  maxFontSizeMultiplier={1.4}
                >
                  Pujar àudio
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
