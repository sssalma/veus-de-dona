import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image, Dimensions,
  Platform, Linking, KeyboardAvoidingView,
} from "react-native";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS } from "../../constants";
import { getParada, getParades, getParadaFoto } from "../../services/parades";
import { getTextosByParada } from "../../services/textos";
import { checkLike, addLike, removeLike } from "../../services/likes";
import { getMevesVisites, registrarVisita } from "../../services/visites";
import { getComentaris, afegirComentari, eliminarComentari, respondreComentari } from "../../services/comentaris";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { Parada, TextDto, Comentari } from "../../types";
import AudioPlayer from "../../components/AudioPlayer";
import CopyButton from "../../components/CopyButton";

const ACCESSIBLE_FONT = Platform.select({ ios: "DMSans", android: "DMSans" }) ?? "DMSans";

const LOCALE_PER_IDIOMA: Record<string, string> = {
  CA: "ca-ES",
  ES: "es-ES",
  EN: "en-GB",
};

export default function ParadaScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuth();
  const { t, idioma } = useLanguage();
  const potModerar = user?.rol === "EDITOR" || user?.rol === "ADMINISTRADOR";
  const locale = LOCALE_PER_IDIOMA[idioma] ?? "ca-ES";
  const MODE_LABELS: Record<"REMOT" | "GUIAT" | "LLIURE", string> = {
    REMOT: t("parada.mode.REMOT"),
    GUIAT: t("parada.mode.GUIAT"),
    LLIURE: t("parada.mode.LLIURE"),
  };
  const [parada, setParada] = useState<Parada | null>(null);
  const [textos, setTextos] = useState<TextDto[]>([]);
  const [totes, setTotes] = useState<Parada[]>([]);
  const [textSeleccionat, setTextSeleccionat] = useState(0);
  const [textExpandit, setTextExpandit] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [visitant, setVisitant] = useState(false);
  const [mode, setMode] = useState<"REMOT" | "GUIAT" | "LLIURE" | null>(null);
  const [comentaris, setComentaris] = useState<Comentari[]>([]);
  const [nouComentari, setNouComentari] = useState("");
  const [enviantComentari, setEnviantComentari] = useState(false);
  const [respostesModeracio, setRespostesModeracio] = useState<Record<string, string>>({});
  const [enviantResposta, setEnviantResposta] = useState<string | null>(null);
  const [visitLoading, setVisitLoading] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [fotoHeight, setFotoHeight] = useState(200);

  useEffect(() => {
    const pid = id as string;
    getParada(pid).then(setParada).catch(() => setParada(null));
    getTextosByParada(pid).then(setTextos).catch(() => setTextos([]));
    getParades().then(setTotes).catch(() => setTotes([]));
    getComentaris(pid).then(setComentaris).catch(() => setComentaris([]));
    getParadaFoto(pid).then((url) => {
      setFotoUrl(url);
      Image.getSize(url, (w, h) => {
        const screenW = Dimensions.get("window").width;
        setFotoHeight(screenW * (h / w));
      }, () => setFotoHeight(200));
    }).catch(() => setFotoUrl(null));
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const pid = id as string;
    getMevesVisites().then((visites) => {
      const visita = visites.find((v) => v.parada_id === pid);
      if (visita) {
        setVisitant(true);
        setMode(visita.mode);
      }
    }).catch(() => {});
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (textos.length > 0 && isAuthenticated) {
      checkLike(textos[textSeleccionat].id).then((res) => {
        setLiked(res.liked);
        setLikesCount(res.count);
      }).catch(() => {});
    }
  }, [textos, textSeleccionat, isAuthenticated]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      Alert.alert(t("parada.loginTitle"), t("parada.likeLoginMsg"), [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("auth.loginButton"), onPress: () => router.push("/login") },
      ]);
      return;
    }
    if (textos.length === 0) return;
    const textId = textos[textSeleccionat].id;
    try {
      if (liked) {
        await removeLike(textId);
        setLiked(false);
        setLikesCount((c) => Math.max(0, c - 1));
      } else {
        await addLike(textId);
        setLiked(true);
        setLikesCount((c) => c + 1);
      }
    } catch {
      Alert.alert(t("common.error"), t("parada.likeError"));
    }
  };

  const handleVisitar = async () => {
    if (!isAuthenticated) {
      Alert.alert(t("parada.loginTitle"), t("parada.loginToVisitMsg"), [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("auth.loginButton"), onPress: () => router.push("/login") },
      ]);
      return;
    }
    setVisitLoading(true);
    try {
      let lat: number | undefined;
      let lng: number | undefined;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const last = await Location.getLastKnownPositionAsync();
        if (last) {
          lat = last.coords.latitude;
          lng = last.coords.longitude;
        } else {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
        }
      }
      const visita = await registrarVisita(id as string, lat, lng);
      setVisitant(true);
      setMode(visita.mode);
      Alert.alert(t("parada.visitSuccessTitle"), t("parada.visitSuccessMsg"));
    } catch (err: any) {
      const msg = err?.response?.data?.detail || t("parada.visitError");
      Alert.alert(t("common.error"), msg);
    } finally {
      setVisitLoading(false);
    }
  };

  const handleAfegirComentari = async () => {
    if (!nouComentari.trim()) return;
    if (!isAuthenticated) {
      Alert.alert(t("parada.loginTitle"), t("parada.commentLoginMsg"), [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("auth.loginButton"), onPress: () => router.push("/login") },
      ]);
      return;
    }
    setEnviantComentari(true);
    try {
      const comentari = await afegirComentari(id as string, nouComentari.trim());
      setComentaris((prev) => [comentari, ...prev]);
      setNouComentari("");
    } catch {
      Alert.alert(t("common.error"), t("parada.commentError"));
    } finally {
      setEnviantComentari(false);
    }
  };

  const handleEliminarComentari = (comentariId: string) => {
    Alert.alert(t("parada.deleteCommentTitle"), t("parada.deleteCommentMsg"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await eliminarComentari(comentariId);
            setComentaris((prev) => prev.filter((c) => c.id !== comentariId));
          } catch {
            Alert.alert(t("common.error"), t("parada.deleteCommentError"));
          }
        },
      },
    ]);
  };

  const handleRespondreComentari = async (comentariId: string) => {
    const resposta = (respostesModeracio[comentariId] ?? "").trim();
    if (!resposta) return;
    setEnviantResposta(comentariId);
    try {
      const actualitzat = await respondreComentari(comentariId, resposta);
      setComentaris((prev) => prev.map((c) => (c.id === comentariId ? actualitzat : c)));
      setRespostesModeracio((prev) => ({ ...prev, [comentariId]: "" }));
    } catch {
      Alert.alert(t("common.error"), t("parada.replyError"));
    } finally {
      setEnviantResposta(null);
    }
  };

  if (!parada) {
    return (
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={t("parada.notFound")}
        style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg }}
      >
        <Text
          style={{ fontFamily: FONTS.sans, color: COLORS.textSecondary, fontSize: 14 }}
          maxFontSizeMultiplier={1.5}
        >
          {t("parada.notFound")}
        </Text>
      </View>
    );
  }

  const idx = totes.findIndex((p) => p.id === id);
  const prevParada = idx > 0 ? totes[idx - 1] : null;
  const nextParada = idx !== -1 && idx < totes.length - 1 ? totes[idx + 1] : null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }} keyboardShouldPersistTaps="handled">
      <View
        accessibilityRole="header"
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 14,
          paddingTop: insets.top + 6,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          minHeight: 44,
        }}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t("parada.back")}
          onPress={() => router.back()}
          style={{ minWidth: 44, minHeight: 44, justifyContent: "center" }}
        >
          <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary }} maxFontSizeMultiplier={1.4}>
            {t("parada.back")}
          </Text>
        </TouchableOpacity>
        <View
          accessibilityRole="text"
          accessibilityLabel={`${t("parada.stopLabel")} ${parada.ordre} / 10`}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 3,
            backgroundColor: COLORS.darkBg,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: 9,
              fontWeight: "500",
              color: COLORS.bg,
            }}
            maxFontSizeMultiplier={1.4}
          >
            {t("parada.stopLabel").toUpperCase()} {parada.ordre} / 10
          </Text>
        </View>
        {mode && (
          <View
            accessibilityRole="text"
            accessibilityLabel={`${MODE_LABELS[mode]}`}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{ fontFamily: FONTS.sans, fontSize: 9, color: COLORS.textSecondary }}
              maxFontSizeMultiplier={1.4}
            >
              {MODE_LABELS[mode]}
            </Text>
          </View>
        )}
      </View>

      <View
        accessibilityRole="image"
        accessibilityLabel={`Fotografia de ${parada.nom_espai}`}
        style={{ height: fotoHeight, backgroundColor: COLORS.darkBg }}
      >
        {fotoUrl ? (
          <Image
            source={{ uri: fotoUrl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: 10,
                color: "#FFFFFF",
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}
              maxFontSizeMultiplier={1.4}
            >
              {parada.nom_espai}
            </Text>
          </View>
        )}
      </View>

      <View style={{ paddingHorizontal: 14, paddingTop: 8 }}>
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: FONTS.serif,
            fontSize: 18,
            fontWeight: "600",
            color: COLORS.text,
          }}
          maxFontSizeMultiplier={1.5}
        >
          {parada.nom_espai}
        </Text>
      </View>

      {textos.length > 0 && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ paddingLeft: 14, marginTop: 8 }}
            contentContainerStyle={{ gap: 6, paddingRight: 14 }}
            accessibilityRole="radiogroup"
            accessibilityLabel="Selecció d'autora"
          >
            {textos.map((texto, i) => {
              const autora = texto.autora;
              const initials = autora
                ? `${autora.nom[0]}${autora.cognom[0]}`
                : "??";
              const selected = i === textSeleccionat;
              return (
                <TouchableOpacity
                  key={texto.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Autora: ${autora?.nom ?? "Desconeguda"} ${autora?.cognom ?? ""}`}
                  onPress={() => {
                    if (selected) {
                      router.push(`/autora/${autora?.id}`);
                    } else {
                      setTextSeleccionat(i);
                      setTextExpandit(false);
                    }
                  }}
                  style={{
                    alignItems: "center",
                    gap: 3,
                    paddingBottom: 6,
                    paddingHorizontal: 4,
                    borderBottomWidth: selected ? 2 : 0,
                    borderBottomColor: COLORS.text,
                    minWidth: 64,
                    minHeight: 64,
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: selected ? COLORS.accent : COLORS.textSecondary,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.sans,
                        fontSize: 12,
                        fontWeight: "600",
                        color: COLORS.bg,
                      }}
                      maxFontSizeMultiplier={1.3}
                    >
                      {initials}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: 9,
                      color: selected ? COLORS.text : COLORS.textSecondary,
                    }}
                    maxFontSizeMultiplier={1.3}
                    numberOfLines={1}
                  >
                    {autora?.nom.split(" ")[0] ?? "??"}. {autora?.cognom ?? "??"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={{ paddingHorizontal: 14, paddingTop: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
              <Text
                accessibilityRole="header"
                style={{
                  flex: 1,
                  fontFamily: FONTS.sans,
                  fontSize: 10,
                  fontStyle: "italic",
                  color: COLORS.textSecondary,
                  marginBottom: 4,
                }}
                maxFontSizeMultiplier={1.4}
              >
                {textos[textSeleccionat].titol}
                {textos[textSeleccionat].obra_origen ? ` · ${textos[textSeleccionat].obra_origen}` : ""}
              </Text>
              <CopyButton
                text={`${textos[textSeleccionat].titol}\n\n${textos[textSeleccionat].contingut}`}
              />
            </View>
            <View
              accessibilityRole="text"
              style={{
                borderLeftWidth: 2,
                borderLeftColor: COLORS.text,
                paddingLeft: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.serif,
                  fontStyle: "italic",
                  fontSize: 12,
                  color: COLORS.text,
                  lineHeight: 20,
                  maxHeight: textExpandit ? undefined : 52,
                  overflow: textExpandit ? "visible" : "hidden",
                }}
                numberOfLines={textExpandit ? undefined : 3}
                maxFontSizeMultiplier={1.5}
              >
                {textos[textSeleccionat].contingut}
              </Text>
            </View>
          </View>
          {textExpandit && (
            <>
              <View
                accessibilityRole="toolbar"
                style={{
                  flexDirection: "row",
                  alignItems: "stretch",
                  paddingHorizontal: 14,
                  paddingTop: 8,
                  gap: 6,
                }}
              >
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={liked ? t("parada.removeLike") : t("parada.giveLike")}
                  accessibilityState={{ selected: liked }}
                  onPress={handleLike}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    minHeight: 44,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: liked ? "#F5EDEA" : "transparent",
                    borderWidth: 1,
                    borderColor: liked ? COLORS.love : COLORS.border,
                  }}
                >
                  <Text style={{ color: liked ? COLORS.love : COLORS.textSecondary, fontSize: 14 }}>
                    {liked ? "♥" : "♡"}
                  </Text>
                  <Text
                    style={{ fontFamily: FONTS.sans, fontSize: 11, color: liked ? COLORS.love : COLORS.text }}
                    maxFontSizeMultiplier={1.4}
                  >
                    {likesCount > 0 ? likesCount : t("parada.likeLabel")}
                  </Text>
                </TouchableOpacity>
                {textos[textSeleccionat]?.youtube_url && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={t("parada.video")}
                    onPress={() => Linking.openURL(textos[textSeleccionat].youtube_url!)}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: COLORS.text,
                      paddingVertical: 12,
                      borderRadius: 6,
                      minHeight: 44,
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.sans,
                        fontSize: 10,
                        fontWeight: "500",
                        color: COLORS.text,
                        textAlign: "center",
                      }}
                      maxFontSizeMultiplier={1.4}
                    >
                      🎬 {t("parada.video")}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={{ paddingHorizontal: 14, paddingTop: 6 }}>
                <AudioPlayer textId={textos[textSeleccionat].id} />
              </View>
            </>
          )}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={textExpandit ? t("parada.readLess") : t("parada.readMore")}
            accessibilityState={{ expanded: textExpandit }}
            onPress={() => setTextExpandit(!textExpandit)}
            style={{ paddingHorizontal: 14, paddingVertical: 6, minHeight: 44, justifyContent: "center" }}
          >
            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: 10,
                color: COLORS.accent,
              }}
              maxFontSizeMultiplier={1.4}
            >
              {textExpandit ? t("parada.readLess") : t("parada.readMore")}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={visitant ? t("parada.visited") : t("parada.markVisited")}
        accessibilityState={{ disabled: visitLoading || visitant }}
        onPress={handleVisitar}
        disabled={visitLoading || visitant}
        style={{
          marginHorizontal: 14,
          marginVertical: 6,
          borderWidth: 1.5,
          borderColor: visitant ? COLORS.accent : "#7a6654",
          borderStyle: visitant ? "solid" : "dashed",
          borderRadius: 6,
          paddingVertical: 12,
          paddingHorizontal: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          backgroundColor: visitant ? "#EDEAF5" : "transparent",
          minHeight: 48,
        }}
      >
        {visitLoading ? (
          <ActivityIndicator size="small" color={COLORS.accent} />
        ) : (
          <>
            {visitant ? (
              <Text
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 14,
                  fontWeight: "600",
                  color: COLORS.accent,
                }}
                maxFontSizeMultiplier={1.3}
              >
                ✓
              </Text>
            ) : (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: COLORS.love,
                }}
              />
            )}
            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: 10,
                fontWeight: "500",
                color: visitant ? COLORS.accent : "#3a3028",
              }}
              maxFontSizeMultiplier={1.4}
            >
              {visitant ? t("parada.visited") : t("parada.markVisited")}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {(prevParada || nextParada) && (
        <View
          accessibilityRole="toolbar"
          style={{ flexDirection: "row", gap: 6, paddingHorizontal: 14, paddingVertical: 6 }}
        >
          {prevParada && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`${t("parada.prevStop")}: ${prevParada.nom_espai}`}
              onPress={() => router.replace(`/parada/${prevParada.id}`)}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 6,
                paddingVertical: 10,
                paddingHorizontal: 10,
                minHeight: 44,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 10,
                  color: COLORS.textSecondary,
                }}
                maxFontSizeMultiplier={1.4}
                numberOfLines={1}
              >
                ← {prevParada.nom_espai}
              </Text>
            </TouchableOpacity>
          )}
          {nextParada && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`${t("parada.nextStop")}: ${nextParada.nom_espai}`}
              onPress={() => router.replace(`/parada/${nextParada.id}`)}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: COLORS.text,
                borderRadius: 6,
                paddingVertical: 10,
                paddingHorizontal: 10,
                minHeight: 44,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 10,
                  color: COLORS.text,
                  textAlign: "right",
                }}
                maxFontSizeMultiplier={1.4}
                numberOfLines={1}
              >
                {nextParada.nom_espai} →
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 9,
                  color: COLORS.textSecondary,
                  textAlign: "right",
                }}
                maxFontSizeMultiplier={1.3}
              >
                {t("parada.stopLabel")} {nextParada.ordre}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          marginTop: 6,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
            minHeight: 44,
          }}
        >
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: FONTS.sans,
              fontSize: 12,
              fontWeight: "500",
              color: COLORS.text,
            }}
            maxFontSizeMultiplier={1.5}
          >
            {t("parada.comments")}
          </Text>
          <View
            accessibilityRole="text"
            accessibilityLabel={`${comentaris.length} ${t("parada.comments").toLowerCase()}`}
            style={{
              backgroundColor: "#E8E2F0",
              borderRadius: 10,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: 10,
                color: "#6B5B8A",
                fontWeight: "600",
              }}
              maxFontSizeMultiplier={1.3}
            >
              {comentaris.length}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 4, marginBottom: 8 }}>
          <TextInput
            accessibilityRole="text"
            accessibilityLabel={t("parada.commentPlaceholder")}
            placeholder={t("parada.commentPlaceholder")}
            placeholderTextColor={COLORS.textSecondary}
            value={nouComentari}
            onChangeText={setNouComentari}
            multiline
            blurOnSubmit
            style={{
              flex: 1,
              borderWidth: 1.5,
              borderColor: COLORS.border,
              borderRadius: 6,
              paddingHorizontal: 10,
              paddingVertical: 10,
              fontFamily: FONTS.sans,
              fontSize: 11,
              color: COLORS.text,
              backgroundColor: "#f5f2ec",
              maxHeight: 80,
              minHeight: 44,
            }}
          />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t("common.send")}
            accessibilityState={{ disabled: enviantComentari || !nouComentari.trim() }}
            onPress={handleAfegirComentari}
            disabled={enviantComentari || !nouComentari.trim()}
            style={{
              backgroundColor: COLORS.darkBg,
              borderRadius: 6,
              paddingHorizontal: 14,
              justifyContent: "center",
              opacity: enviantComentari || !nouComentari.trim() ? 0.5 : 1,
              minWidth: 44,
              minHeight: 44,
            }}
          >
            <Text
              style={{ fontFamily: FONTS.sans, fontSize: 11, color: COLORS.bg }}
              maxFontSizeMultiplier={1.3}
            >
              {t("common.send")}
            </Text>
          </TouchableOpacity>
        </View>

        {comentaris.length === 0 ? (
          <Text
            accessibilityRole="text"
            style={{
              fontFamily: FONTS.sans,
              fontSize: 10,
              color: COLORS.textSecondary,
              fontStyle: "italic",
            }}
            maxFontSizeMultiplier={1.4}
          >
            {t("parada.noComments")}
          </Text>
        ) : (
          comentaris.map((c) => (
            <View
              key={c.id}
              style={{
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: "#e0dcd0",
                gap: 6,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  {user?.rol === "ADMINISTRADOR" ? (
                    <TouchableOpacity
                      accessibilityRole="link"
                      accessibilityLabel={`Veure ${c.usuari_nom ?? "usuari"} ${c.usuari_cognom ?? ""} a Gestionar usuaris`}
                      onPress={() => router.push(`/(admin)/usuaris?resaltar=${c.usuari_id}`)}
                      style={{ minHeight: 20, justifyContent: "center" }}
                    >
                      <Text
                        style={{ fontFamily: FONTS.sans, fontSize: 10, fontWeight: "600", color: COLORS.accent }}
                        maxFontSizeMultiplier={1.4}
                      >
                        {c.usuari_nom ?? "Usuari"} {c.usuari_cognom ?? ""}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    c.usuari_nom && (
                      <Text
                        style={{ fontFamily: FONTS.sans, fontSize: 10, fontWeight: "600", color: COLORS.text }}
                        maxFontSizeMultiplier={1.4}
                      >
                        {c.usuari_nom} {c.usuari_cognom ?? ""}
                      </Text>
                    )
                  )}
                  <Text
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: 9,
                      color: COLORS.textSecondary,
                    }}
                    maxFontSizeMultiplier={1.3}
                  >
                    {new Date(c.data_creacio).toLocaleDateString(locale, {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                {potModerar && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={t("common.delete")}
                    onPress={() => handleEliminarComentari(c.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ minHeight: 32, minWidth: 32, alignItems: "center", justifyContent: "center" }}
                  >
                    <Text style={{ fontSize: 13 }}>🗑</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text
                accessibilityRole="text"
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 11,
                  color: COLORS.text,
                  lineHeight: 17,
                }}
                maxFontSizeMultiplier={1.5}
              >
                {c.contingut}
              </Text>

              {c.resposta_editor ? (
                <View
                  accessibilityRole="text"
                  accessibilityLabel={`${t("parada.editorReply")}: ${c.resposta_editor}`}
                  style={{
                    backgroundColor: COLORS.lightBg,
                    borderRadius: 6,
                    padding: 8,
                    borderLeftWidth: 2,
                    borderLeftColor: COLORS.accent,
                  }}
                >
                  <Text style={{ fontFamily: FONTS.sans, fontSize: 9, color: COLORS.accent, marginBottom: 2 }} maxFontSizeMultiplier={1.3}>
                    {t("parada.editorReply")}
                  </Text>
                  <Text style={{ fontFamily: FONTS.sans, fontSize: 11, color: COLORS.text }} maxFontSizeMultiplier={1.5}>
                    {c.resposta_editor}
                  </Text>
                </View>
              ) : (
                potModerar && (
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <TextInput
                      accessibilityRole="text"
                      accessibilityLabel={`${t("parada.replyPlaceholder")}: ${c.contingut}`}
                      placeholder={t("parada.replyPlaceholder")}
                      placeholderTextColor={COLORS.textSecondary}
                      value={respostesModeracio[c.id] ?? ""}
                      onChangeText={(text) => setRespostesModeracio((prev) => ({ ...prev, [c.id]: text }))}
                      maxFontSizeMultiplier={1.5}
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        borderRadius: 6,
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                        fontFamily: FONTS.sans,
                        fontSize: 11,
                        color: COLORS.text,
                        minHeight: 44,
                      }}
                    />
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={t("common.send")}
                      accessibilityState={{ disabled: enviantResposta === c.id || !(respostesModeracio[c.id] ?? "").trim() }}
                      onPress={() => handleRespondreComentari(c.id)}
                      disabled={enviantResposta === c.id || !(respostesModeracio[c.id] ?? "").trim()}
                      style={{
                        backgroundColor: COLORS.darkBg,
                        borderRadius: 6,
                        paddingHorizontal: 12,
                        justifyContent: "center",
                        opacity: enviantResposta === c.id || !(respostesModeracio[c.id] ?? "").trim() ? 0.5 : 1,
                        minHeight: 44,
                        minWidth: 44,
                      }}
                    >
                      <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.bg }} maxFontSizeMultiplier={1.3}>
                        {t("common.send")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )
              )}

            </View>
          ))
        )}
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
