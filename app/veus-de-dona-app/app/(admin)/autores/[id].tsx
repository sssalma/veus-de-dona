import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, ROTUL_SECCIO } from "../../../constants";
import { useLanguage } from "../../../contexts/LanguageContext";
import { Capcalera } from "../../../components/Capcalera";
import { BotoDesar } from "../../../components/admin/BotoDesar";
import { EstatLlista } from "../../../components/admin/LlistaAdmin";
import {
  getAutora,
  updateAutora,
  getAutoraFoto,
  updateAutoraFoto,
  getTraduccionsAutora,
  setTraduccioAutora,
  esborraTraduccioAutora,
} from "../../../services/autores";
import { missatgeError } from "../../../services/errors";
import FormField from "../../../components/FormField";

// El català no hi surt: s'edita al camp de biografia de més amunt.
const IDIOMES_TRADUIBLES = ["ES", "EN"] as const;
const NOM_IDIOMA: Record<string, string> = { ES: "Castellà", EN: "Anglès" };

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
  // Biografies en els altres idiomes. El català viu a `bio`.
  const [traduccions, setTraduccions] = useState<Record<string, string>>({});
  const [desantIdioma, setDesantIdioma] = useState<string | null>(null);

  useEffect(() => {
    // Sense idioma a propòsit: aquest camp edita la biografia catalana. Si es
    // demanés en l'idioma de la interfície, s'hi desaria una traducció a sobre.
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
    // Un 404 vol dir que encara no té retrat.
    getAutoraFoto(id)
      .then(setFotoUrl)
      .catch(() => setFotoUrl(null));
    getTraduccionsAutora(id)
      .then((llista) => {
        const per: Record<string, string> = {};
        llista.forEach((tr) => {
          per[tr.idioma] = tr.bio;
        });
        setTraduccions(per);
      })
      .catch(() => setTraduccions({}));
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

  const handleDesarTraduccio = async (idiomaCodi: string) => {
    const text = (traduccions[idiomaCodi] ?? "").trim();
    if (!text) return;
    setDesantIdioma(idiomaCodi);
    try {
      await setTraduccioAutora(id, idiomaCodi, text);
      Alert.alert(t("admin.translationSaved"), "");
    } catch (err) {
      Alert.alert(t("common.error"), missatgeError(err, t("admin.translationError")));
    } finally {
      setDesantIdioma(null);
    }
  };

  const handleEsborrarTraduccio = (idiomaCodi: string) => {
    Alert.alert(t("admin.translationDelete"), t("admin.translationDeleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await esborraTraduccioAutora(id, idiomaCodi);
            setTraduccions((prev) => {
              const seguent = { ...prev };
              delete seguent[idiomaCodi];
              return seguent;
            });
          } catch (err) {
            Alert.alert(
              t("common.error"),
              missatgeError(err, t("admin.translationDeleteError"))
            );
          }
        },
      },
    ]);
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

            {/* ---------- traduccions de la biografia ---------- */}
            <View
              style={{
                marginTop: 28,
                paddingTop: 18,
                borderTopWidth: 1,
                borderTopColor: COLORS.border,
                gap: 8,
              }}
            >
              <Text accessibilityRole="header" style={ROTUL_SECCIO} maxFontSizeMultiplier={1.4}>
                {t("admin.translations")}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 12,
                  color: COLORS.textSecondary,
                  lineHeight: 17,
                  marginBottom: 6,
                }}
                maxFontSizeMultiplier={1.4}
              >
                {t("admin.translationsDesc")}
              </Text>

              {IDIOMES_TRADUIBLES.map((codi) => {
                const valor = traduccions[codi] ?? "";
                const desada = valor.trim().length > 0;
                return (
                  <View key={codi} style={{ marginBottom: 10 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONTS.sans,
                          fontSize: 13,
                          fontWeight: "600",
                          color: COLORS.text,
                        }}
                        maxFontSizeMultiplier={1.4}
                      >
                        {NOM_IDIOMA[codi]}
                      </Text>
                      {!desada && (
                        <Text
                          style={{
                            fontFamily: FONTS.sans,
                            fontSize: 11,
                            fontStyle: "italic",
                            color: COLORS.textSecondary,
                          }}
                          maxFontSizeMultiplier={1.3}
                        >
                          {t("admin.translationMissing")}
                        </Text>
                      )}
                    </View>

                    <FormField
                      label=""
                      value={valor}
                      onChangeText={(text) =>
                        setTraduccions((prev) => ({ ...prev, [codi]: text }))
                      }
                      multiline
                      numberOfLines={5}
                      style={{ minHeight: 100, textAlignVertical: "top" }}
                    />

                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={`${t("common.save")} ${NOM_IDIOMA[codi]}`}
                        accessibilityState={{
                          disabled: desantIdioma === codi || !valor.trim(),
                          busy: desantIdioma === codi,
                        }}
                        onPress={() => handleDesarTraduccio(codi)}
                        disabled={desantIdioma === codi || !valor.trim()}
                        style={{
                          flex: 1,
                          borderWidth: 1,
                          borderColor: COLORS.controlBorder,
                          borderRadius: 8,
                          minHeight: 46,
                          justifyContent: "center",
                          opacity: desantIdioma === codi || !valor.trim() ? 0.45 : 1,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: FONTS.sans,
                            fontSize: 13,
                            color: COLORS.text,
                            textAlign: "center",
                          }}
                          maxFontSizeMultiplier={1.4}
                        >
                          {t("common.save")}
                        </Text>
                      </TouchableOpacity>

                      {desada && (
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={`${t("admin.translationDelete")} ${NOM_IDIOMA[codi]}`}
                          onPress={() => handleEsborrarTraduccio(codi)}
                          style={{
                            width: 52,
                            minHeight: 46,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons name="trash-outline" size={19} color={COLORS.love} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
