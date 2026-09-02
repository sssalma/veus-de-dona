import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Switch, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { COLORS, FONTS, ROTUL_SECCIO } from "../../../constants";
import { useLanguage } from "../../../contexts/LanguageContext";
import { Capcalera } from "../../../components/Capcalera";
import { BotoDesar } from "../../../components/admin/BotoDesar";
import { EstatLlista } from "../../../components/admin/LlistaAdmin";
import {
  getParada,
  getParadaFoto,
  updateParada,
  updateParadaFoto,
  toggleParadaActiva,
} from "../../../services/parades";
import { missatgeError } from "../../../services/errors";
import FormField from "../../../components/FormField";

export default function EditarParada() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
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
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    getParadaFoto(id)
      .then(setFotoUrl)
      .catch(() => setFotoUrl(null));
  }, [id]);

  const handleCanviarFoto = async () => {
    const permis = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permis.granted) {
      Alert.alert(t("common.error"), t("admin.photoPermission"));
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
      setFotoUrl(await getParadaFoto(id));
    } catch (err) {
      Alert.alert(t("common.error"), missatgeError(err, t("admin.photoUploadError")));
    } finally {
      setPujantFoto(false);
    }
  };

  const handleDesar = async () => {
    if (!nomEspai.trim()) {
      Alert.alert(t("common.error"), t("admin.spaceNameRequired"));
      return;
    }
    setDesant(true);
    try {
      await updateParada(id, { nom_espai: nomEspai.trim() });
      router.back();
    } catch (err) {
      Alert.alert(t("common.error"), missatgeError(err, t("admin.saveError")));
    } finally {
      setDesant(false);
    }
  };

  // Es desa tot sol, sense passar pel botó de desar.
  const handleToggleActiva = async (valor: boolean) => {
    setActiva(valor);
    try {
      await toggleParadaActiva(id, valor);
    } catch (err) {
      setActiva(!valor);
      Alert.alert(t("common.error"), missatgeError(err, t("admin.stopStateError")));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <Capcalera tornarA="panell" titol={t("admin.editParada")} />

        <EstatLlista loading={loading} error={error} buit={false} missatgeBuit={t("admin.loadError")} />

        {!loading && !error && (
          <View style={{ paddingHorizontal: 18, paddingTop: 18 }}>
            <Text
              style={[ROTUL_SECCIO, { marginBottom: 8 }]}
              maxFontSizeMultiplier={1.4}
            >
              {t("admin.stopPhoto")}
            </Text>

            <View
              style={{
                height: 150,
                borderRadius: 12,
                backgroundColor: COLORS.lightBg,
                borderWidth: 1,
                borderColor: COLORS.border,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              {fotoUrl ? (
                <Image
                  accessibilityIgnoresInvertColors
                  source={{ uri: fotoUrl }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <Text
                  style={{ fontFamily: FONTS.sans, fontSize: 12, color: COLORS.textSecondary }}
                  maxFontSizeMultiplier={1.4}
                >
                  {t("admin.noPhoto")}
                </Text>
              )}
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t("admin.changePhoto")}
              accessibilityState={{ disabled: pujantFoto, busy: pujantFoto }}
              onPress={handleCanviarFoto}
              disabled={pujantFoto}
              style={{
                borderWidth: 1,
                borderColor: COLORS.controlBorder,
                borderRadius: 8,
                paddingVertical: 12,
                minHeight: 46,
                justifyContent: "center",
                opacity: pujantFoto ? 0.55 : 1,
                marginBottom: 18,
              }}
            >
              {pujantFoto ? (
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
                  {t("admin.changePhoto")}
                </Text>
              )}
            </TouchableOpacity>

            <FormField
              label={t("admin.fieldSpaceName")}
              value={nomEspai}
              onChangeText={setNomEspai}
            />

            <View
              style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 12,
                padding: 14,
                marginBottom: 14,
                gap: 6,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  minHeight: 44,
                }}
              >
                <Text
                  style={{ fontFamily: FONTS.sans, fontSize: 13, color: COLORS.text, flex: 1 }}
                  maxFontSizeMultiplier={1.4}
                >
                  {t("admin.stopActive")}
                </Text>
                <Switch
                  accessibilityRole="switch"
                  accessibilityLabel={t("admin.stopActive")}
                  accessibilityHint={t("admin.stopActiveHint")}
                  value={activa}
                  onValueChange={handleToggleActiva}
                />
              </View>
              <Text
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 12,
                  color: COLORS.textSecondary,
                  lineHeight: 16,
                }}
                maxFontSizeMultiplier={1.4}
              >
                {t("admin.stopActiveHint")}
              </Text>
            </View>

            <BotoDesar desant={desant} onPress={handleDesar} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
