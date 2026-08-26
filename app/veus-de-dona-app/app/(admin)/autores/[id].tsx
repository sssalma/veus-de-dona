import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { COLORS, FONTS, ROTUL_SECCIO } from "../../../constants";
import { useLanguage } from "../../../contexts/LanguageContext";
import { Capcalera } from "../../../components/Capcalera";
import { BotoDesar } from "../../../components/admin/BotoDesar";
import { EstatLlista } from "../../../components/admin/LlistaAdmin";
import { getAutora, updateAutora, getAutoraFoto, updateAutoraFoto } from "../../../services/autores";
import { missatgeError } from "../../../services/errors";
import FormField from "../../../components/FormField";

export default function EditarAutora() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
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
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    // Un 404 aquí només vol dir que encara no en té: es queda sense retrat.
    getAutoraFoto(id)
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
      await updateAutoraFoto(id, {
        uri: asset.uri,
        name: asset.fileName || "retrat.jpg",
        type: asset.mimeType || "image/jpeg",
      });
      setFotoUrl(await getAutoraFoto(id));
    } catch (err) {
      Alert.alert(t("common.error"), missatgeError(err, t("admin.photoUploadError")));
    } finally {
      setPujantFoto(false);
    }
  };

  const handleDesar = async () => {
    if (!nom.trim() || !cognom.trim()) {
      Alert.alert(t("common.error"), t("admin.nameRequired"));
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
    } catch (err) {
      Alert.alert(t("common.error"), missatgeError(err, t("admin.saveError")));
    } finally {
      setDesant(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <Capcalera tornarA="panell" titol={t("admin.editAutora")} />

        <EstatLlista loading={loading} error={error} buit={false} missatgeBuit={t("admin.loadError")} />

        {!loading && !error && (
          <View style={{ paddingHorizontal: 18, paddingTop: 18 }}>
            <Text
              style={[ROTUL_SECCIO, { marginBottom: 8 }]}
              maxFontSizeMultiplier={1.4}
            >
              {t("admin.portrait")}
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <View
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  backgroundColor: COLORS.lightBg,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
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
                    style={{ fontFamily: FONTS.sans, fontSize: 11, color: COLORS.textSecondary }}
                    maxFontSizeMultiplier={1.3}
                  >
                    {t("admin.noPhoto")}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t("admin.changePortrait")}
                accessibilityState={{ disabled: pujantFoto, busy: pujantFoto }}
                onPress={handleCanviarFoto}
                disabled={pujantFoto}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: COLORS.controlBorder,
                  borderRadius: 8,
                  paddingVertical: 12,
                  minHeight: 46,
                  justifyContent: "center",
                  opacity: pujantFoto ? 0.55 : 1,
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
                    {t("admin.changePortrait")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <FormField label={t("admin.fieldName")} value={nom} onChangeText={setNom} />
            <FormField label={t("admin.fieldSurname")} value={cognom} onChangeText={setCognom} />
            <FormField
              label={t("admin.fieldYears")}
              placeholder="1900-1980"
              value={anysVida}
              onChangeText={setAnysVida}
            />
            <FormField
              label={t("admin.fieldBio")}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={6}
              style={{ minHeight: 120, textAlignVertical: "top" }}
            />

            <BotoDesar desant={desant} onPress={handleDesar} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
