import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, ROTUL_SECCIO } from "../../../constants";
import { useLanguage } from "../../../contexts/LanguageContext";
import { Capcalera } from "../../../components/Capcalera";
import { BotoDesar } from "../../../components/admin/BotoDesar";
import { EstatLlista } from "../../../components/admin/LlistaAdmin";
import { getText, updateText } from "../../../services/textos";
import { getRecursosByText, pujarRecurs, esborrarRecurs } from "../../../services/recursos";
import { missatgeError } from "../../../services/errors";
import { Recurs } from "../../../types";
import FormField from "../../../components/FormField";

export default function EditarText() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [desant, setDesant] = useState(false);
  const [titol, setTitol] = useState("");
  const [obraOrigen, setObraOrigen] = useState("");
  const [contingut, setContingut] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  // Recursos d'àudio vinculats al text. L'API ja ho permetia (POST i DELETE
  // /recursos) però no hi havia cap pantalla: els àudios de la ruta només es
  // podien carregar amb l'script seed_audios.py.
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
      .then((text) => {
        setTitol(text.titol);
        setObraOrigen(text.obra_origen ?? "");
        setContingut(text.contingut);
        setYoutubeUrl(text.youtube_url ?? "");
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDesar = async () => {
    if (!titol.trim() || !contingut.trim()) {
      Alert.alert(t("common.error"), t("admin.titleContentRequired"));
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
    } catch (err) {
      Alert.alert(t("common.error"), missatgeError(err, t("admin.saveError")));
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
    } catch (err) {
      Alert.alert(t("common.error"), missatgeError(err, t("admin.uploadAudioError")));
    } finally {
      setPujantAudio(false);
    }
  };

  const handleEsborrarRecurs = (recursId: string) => {
    Alert.alert(t("admin.deleteAudio"), t("admin.deleteAudioConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await esborrarRecurs(recursId);
            setRecursos((prev) => prev.filter((r) => r.id !== recursId));
          } catch (err) {
            Alert.alert(t("common.error"), missatgeError(err, t("admin.deleteAudioError")));
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <Capcalera tornarA="panell" titol={t("admin.editText")} />

        <EstatLlista loading={loading} error={error} buit={false} missatgeBuit={t("admin.loadError")} />

        {!loading && !error && (
          <View style={{ paddingHorizontal: 18, paddingTop: 18 }}>
            <FormField label={t("admin.fieldTitle")} value={titol} onChangeText={setTitol} />
            <FormField
              label={t("admin.fieldSourceWork")}
              value={obraOrigen}
              onChangeText={setObraOrigen}
            />
            <FormField
              label={t("admin.fieldContent")}
              value={contingut}
              onChangeText={setContingut}
              multiline
              numberOfLines={8}
              style={{ minHeight: 150, textAlignVertical: "top" }}
            />
            <FormField
              label={t("admin.fieldYoutube")}
              placeholder="https://youtube.com/watch?v=..."
              value={youtubeUrl}
              onChangeText={setYoutubeUrl}
              autoCapitalize="none"
            />

            <BotoDesar desant={desant} onPress={handleDesar} />

            {/* ---------- àudios de lectura ---------- */}
            <View
              style={{
                marginTop: 28,
                paddingTop: 18,
                borderTopWidth: 1,
                borderTopColor: COLORS.border,
              }}
            >
              <Text
                accessibilityRole="header"
                style={[ROTUL_SECCIO, { marginBottom: 10 }]}
                maxFontSizeMultiplier={1.4}
              >
                {t("admin.audios")}
              </Text>

              {recursos.length === 0 ? (
                <Text
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 12,
                    color: COLORS.textSecondary,
                    fontStyle: "italic",
                    marginBottom: 12,
                  }}
                  maxFontSizeMultiplier={1.5}
                >
                  {t("admin.noAudios")}
                </Text>
              ) : (
                recursos.map((r) => (
                  <View
                    key={r.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      marginBottom: 8,
                      minHeight: 52,
                    }}
                  >
                    <Text
                      style={{ fontFamily: FONTS.sans, fontSize: 12, color: COLORS.text, flex: 1 }}
                      numberOfLines={1}
                      maxFontSizeMultiplier={1.4}
                    >
                      {r.minio_key.split("/").pop()}
                    </Text>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={t("admin.deleteAudio")}
                      onPress={() => handleEsborrarRecurs(r.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={{
                        minHeight: 44,
                        minWidth: 44,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="trash-outline" size={19} color={COLORS.love} />
                    </TouchableOpacity>
                  </View>
                ))
              )}

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t("admin.uploadAudio")}
                accessibilityState={{ disabled: pujantAudio, busy: pujantAudio }}
                onPress={handlePujarAudio}
                disabled={pujantAudio}
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.controlBorder,
                  borderRadius: 8,
                  paddingVertical: 12,
                  minHeight: 46,
                  justifyContent: "center",
                  opacity: pujantAudio ? 0.55 : 1,
                }}
              >
                {pujantAudio ? (
                  <ActivityIndicator size="small" color={COLORS.accent} />
                ) : (
                  <Text
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: 13,
                      color: COLORS.text,
                      textAlign: "center",
                    }}
                    maxFontSizeMultiplier={1.4}
                  >
                    {t("admin.uploadAudio")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
