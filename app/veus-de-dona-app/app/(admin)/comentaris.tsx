import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { localeDe } from "../../i18n/etiquetes";
import { Capcalera } from "../../components/Capcalera";
import { EstatLlista } from "../../components/admin/LlistaAdmin";
import {
  getTotsElsComentaris,
  eliminarComentari,
  respondreComentari,
} from "../../services/comentaris";
import { missatgeError } from "../../services/errors";
import { Comentari } from "../../types";

export default function ModeracioComentaris() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, idioma } = useLanguage();
  const [comentaris, setComentaris] = useState<Comentari[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [respostes, setRespostes] = useState<Record<string, string>>({});
  // Comentaris ja respostos que s'han obert per reescriure la resposta.
  const [editant, setEditant] = useState<Record<string, boolean>>({});
  const [enviant, setEnviant] = useState<string | null>(null);

  const locale = localeDe(idioma);

  const carregar = useCallback(() => {
    setLoading(true);
    getTotsElsComentaris()
      .then((dades) => {
        setComentaris(dades);
        setError(false);
      })
      .catch(() => {
        setComentaris([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(carregar);

  const handleEliminar = (id: string) => {
    Alert.alert(t("admin.deleteComment"), t("admin.deleteCommentConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await eliminarComentari(id);
            setComentaris((prev) => prev.filter((c) => c.id !== id));
          } catch (err) {
            Alert.alert(t("common.error"), missatgeError(err, t("admin.deleteCommentError")));
          }
        },
      },
    ]);
  };

  const handleRespondre = async (id: string) => {
    const resposta = (respostes[id] ?? "").trim();
    if (!resposta) return;
    setEnviant(id);
    try {
      const actualitzat = await respondreComentari(id, resposta);
      setComentaris((prev) => prev.map((c) => (c.id === id ? actualitzat : c)));
      setRespostes((prev) => ({ ...prev, [id]: "" }));
      setEditant((prev) => ({ ...prev, [id]: false }));
    } catch (err) {
      Alert.alert(t("common.error"), missatgeError(err, t("admin.replyError")));
    } finally {
      setEnviant(null);
    }
  };

  const obrirEdicio = (c: Comentari) => {
    setRespostes((prev) => ({ ...prev, [c.id]: c.resposta_editor ?? "" }));
    setEditant((prev) => ({ ...prev, [c.id]: true }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <Capcalera tornarA="panell" titol={t("admin.moderationTitle")} />

        <EstatLlista
          loading={loading}
          error={error}
          buit={comentaris.length === 0}
          missatgeBuit={t("admin.noComments")}
        />

        {!loading && !error && comentaris.length > 0 && (
          <View style={{ paddingHorizontal: 18, paddingTop: 18, gap: 10 }}>
            {comentaris.map((c) => {
              const nom = c.usuari_nom ?? t("admin.anonymousUser");
              const cognom = c.usuari_cognom ?? "";
              const respost = Boolean(c.resposta_editor);
              const obert = editant[c.id] === true;
              const esborrany = (respostes[c.id] ?? "").trim();
              const bloquejat = enviant === c.id || esborrany.length === 0;

              return (
                <View
                  key={c.id}
                  style={{
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 12,
                    padding: 14,
                    gap: 9,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      {/* Només l'administració pot obrir la fitxa: la pantalla
                          de gestió d'usuaris exigeix rol ADMINISTRADOR. */}
                      {user?.rol === "ADMINISTRADOR" ? (
                        <TouchableOpacity
                          accessibilityRole="link"
                          accessibilityLabel={`${t("admin.viewUser")}: ${nom} ${cognom}`}
                          onPress={() => router.push(`/(admin)/usuaris?resaltar=${c.usuari_id}`)}
                          style={{ minHeight: 24, justifyContent: "center" }}
                        >
                          <Text
                            style={{
                              fontFamily: FONTS.sans,
                              fontSize: 13,
                              fontWeight: "600",
                              color: COLORS.accent,
                            }}
                            maxFontSizeMultiplier={1.5}
                          >
                            {nom} {cognom}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <Text
                          style={{
                            fontFamily: FONTS.sans,
                            fontSize: 13,
                            fontWeight: "600",
                            color: COLORS.text,
                          }}
                          maxFontSizeMultiplier={1.5}
                        >
                          {nom} {cognom}
                        </Text>
                      )}
                      <Text
                        style={{
                          fontFamily: FONTS.sans,
                          fontSize: 11,
                          color: COLORS.textSecondary,
                          marginTop: 2,
                        }}
                        maxFontSizeMultiplier={1.3}
                      >
                        {new Date(c.data_creacio).toLocaleString(locale)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={t("admin.deleteComment")}
                      onPress={() => handleEliminar(c.id)}
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

                  <Text
                    style={{ fontFamily: FONTS.sans, fontSize: 13, color: COLORS.text, lineHeight: 19 }}
                    maxFontSizeMultiplier={1.5}
                  >
                    {c.contingut}
                  </Text>

                  {respost && !obert ? (
                    <View
                      style={{
                        backgroundColor: COLORS.lightBg,
                        borderRadius: 8,
                        padding: 10,
                        borderLeftWidth: 3,
                        borderLeftColor: COLORS.accent,
                        gap: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONTS.sans,
                          fontSize: 11,
                          fontWeight: "700",
                          letterSpacing: 0.4,
                          textTransform: "uppercase",
                          color: COLORS.accent,
                        }}
                        maxFontSizeMultiplier={1.3}
                      >
                        {t("admin.editorReply")}
                      </Text>
                      <Text
                        style={{
                          fontFamily: FONTS.sans,
                          fontSize: 13,
                          color: COLORS.text,
                          lineHeight: 19,
                        }}
                        maxFontSizeMultiplier={1.5}
                      >
                        {c.resposta_editor}
                      </Text>

                      {/* El servidor permet reescriure la resposta. */}
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={t("admin.editReply")}
                        onPress={() => obrirEdicio(c)}
                        style={{ minHeight: 44, justifyContent: "center" }}
                      >
                        <Text
                          style={{
                            fontFamily: FONTS.sans,
                            fontSize: 12,
                            fontWeight: "600",
                            color: COLORS.accent,
                          }}
                          maxFontSizeMultiplier={1.4}
                        >
                          {t("admin.editReply")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TextInput
                        accessibilityLabel={`${t("admin.replyTo")}: ${c.contingut}`}
                        placeholder={t("admin.replyPlaceholder")}
                        placeholderTextColor={COLORS.textSecondary}
                        value={respostes[c.id] ?? ""}
                        onChangeText={(text) =>
                          setRespostes((prev) => ({ ...prev, [c.id]: text }))
                        }
                        multiline
                        maxFontSizeMultiplier={1.5}
                        style={{
                          flex: 1,
                          borderWidth: 1,
                          borderColor: COLORS.controlBorder,
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          fontFamily: FONTS.sans,
                          fontSize: 13,
                          color: COLORS.text,
                          backgroundColor: COLORS.lightBg,
                          minHeight: 46,
                        }}
                      />
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={t("common.send")}
                        accessibilityState={{ disabled: bloquejat }}
                        onPress={() => handleRespondre(c.id)}
                        disabled={bloquejat}
                        style={{
                          backgroundColor: COLORS.darkBg,
                          borderRadius: 8,
                          paddingHorizontal: 14,
                          justifyContent: "center",
                          opacity: bloquejat ? 0.45 : 1,
                          minHeight: 46,
                          minWidth: 46,
                        }}
                      >
                        <Text
                          style={{ fontFamily: FONTS.sans, fontSize: 12, color: COLORS.bg }}
                          maxFontSizeMultiplier={1.3}
                        >
                          {t("common.send")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
