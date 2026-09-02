import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View, Text, ScrollView, TouchableOpacity, Pressable,
  TextInput, Alert, ActivityIndicator, Image, Dimensions,
  Platform, KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS, ROTUL_SECCIO, VEL_RGB } from "../../constants";
import { getParada, getParades, getParadaFoto } from "../../services/parades";
import { getTextosByParada } from "../../services/textos";
import { getRecursosByText } from "../../services/recursos";
import { checkLike, getLikesCount, addLike, removeLike } from "../../services/likes";
import { getMevesVisites, registrarVisita } from "../../services/visites";
import { getComentaris, afegirComentari, eliminarComentari, respondreComentari } from "../../services/comentaris";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { Parada, TextDto, Comentari } from "../../types";
import TextCard from "../../components/TextCard";
import { missatgeError } from "../../services/errors";

const LOCALE_PER_IDIOMA: Record<string, string> = {
  CA: "ca-ES",
  ES: "es-ES",
  EN: "en-GB",
};

const HERO_MIN = 240;
const HERO_MAX = 420;

interface EstatLike {
  liked: boolean;
  count: number;
}

export default function ParadaScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuth();
  const { t, idioma } = useLanguage();
  const potModerar = user?.rol === "EDITOR" || user?.rol === "ADMINISTRADOR";
  const locale = LOCALE_PER_IDIOMA[idioma] ?? "ca-ES";
  const [parada, setParada] = useState<Parada | null>(null);
  const [textos, setTextos] = useState<TextDto[]>([]);
  const [totes, setTotes] = useState<Parada[]>([]);
  // quins textos estan oberts: són dades per text, no per parada
  const [expandits, setExpandits] = useState<Set<string>>(new Set());
  const [audioPerText, setAudioPerText] = useState<Record<string, string | null>>({});
  const [likes, setLikes] = useState<Record<string, EstatLike>>({});
  const [comentarisOberts, setComentarisOberts] = useState(false);
  const [visitant, setVisitant] = useState(false);
  const [comentaris, setComentaris] = useState<Comentari[]>([]);
  const [nouComentari, setNouComentari] = useState("");
  const [enviantComentari, setEnviantComentari] = useState(false);
  const [respostesModeracio, setRespostesModeracio] = useState<Record<string, string>>({});
  const [enviantResposta, setEnviantResposta] = useState<string | null>(null);
  const [visitLoading, setVisitLoading] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [fotoHeight, setFotoHeight] = useState(HERO_MIN);
  const [carregant, setCarregant] = useState(true);

  useEffect(() => {
    const pid = id as string;
    setCarregant(true);
    getParada(pid)
      .then(setParada)
      .catch(() => setParada(null))
      .finally(() => setCarregant(false));
    // tots els textos arrenquen plegats, també quan la parada només en té un
    getTextosByParada(pid, idioma).then(setTextos).catch(() => setTextos([]));
    getParades().then(setTotes).catch(() => setTotes([]));
    getComentaris(pid).then(setComentaris).catch(() => setComentaris([]));
    getParadaFoto(pid).then((url) => {
      setFotoUrl(url);
      Image.getSize(url, (w, h) => {
        const screenW = Dimensions.get("window").width;
        const alcada = screenW * (h / w);
        setFotoHeight(Math.max(HERO_MIN, Math.min(HERO_MAX, alcada)));
      }, () => setFotoHeight(HERO_MIN));
    }).catch(() => setFotoUrl(null));
  }, [id, idioma]);

  // quins textos tenen àudio: es consulta un cop aquí i es passa a cada text
  useEffect(() => {
    if (textos.length === 0) return;
    Promise.all(
      textos.map((tx) =>
        getRecursosByText(tx.id)
          .then((recursos) => [tx.id, recursos.find((r) => r.tipus === "AUDIO")?.id ?? null] as const)
          .catch(() => [tx.id, null] as const)
      )
    ).then((parelles) => setAudioPerText(Object.fromEntries(parelles)));
  }, [textos]);

  // el recompte de likes és públic; saber si l'usuari ja n'ha donat, no
  useEffect(() => {
    if (textos.length === 0) return;
    Promise.all(
      textos.map((tx) =>
        (isAuthenticated
          ? checkLike(tx.id)
          : getLikesCount(tx.id).then((count) => ({ liked: false, count }))
        )
          .then((estat) => [tx.id, estat] as const)
          .catch(() => [tx.id, { liked: false, count: 0 }] as const)
      )
    ).then((parelles) => setLikes(Object.fromEntries(parelles)));
  }, [textos, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const pid = id as string;
    getMevesVisites().then((visites) => {
      // només cal saber si s'ha visitat; el mode s'ensenya al perfil
      if (visites.some((v) => v.parada_id === pid)) setVisitant(true);
    }).catch(() => {});
  }, [id, isAuthenticated]);

  const toggleText = (textId: string) => {
    setExpandits((prev) => {
      const nou = new Set(prev);
      if (nou.has(textId)) nou.delete(textId);
      else nou.add(textId);
      return nou;
    });
  };

  const handleLike = async (textId: string) => {
    if (!isAuthenticated) {
      Alert.alert(t("parada.loginTitle"), t("parada.likeLoginMsg"), [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("auth.loginButton"), onPress: () => router.push("/login") },
      ]);
      return;
    }
    const actual = likes[textId] ?? { liked: false, count: 0 };
    const optimista: EstatLike = actual.liked
      ? { liked: false, count: Math.max(0, actual.count - 1) }
      : { liked: true, count: actual.count + 1 };
    setLikes((prev) => ({ ...prev, [textId]: optimista }));
    try {
      if (actual.liked) await removeLike(textId);
      else await addLike(textId);
    } catch {
      setLikes((prev) => ({ ...prev, [textId]: actual }));
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
      await registrarVisita(id as string, lat, lng);
      setVisitant(true);
      Alert.alert(t("parada.visitSuccessTitle"), t("parada.visitSuccessMsg"));
    } catch (err: any) {
      const msg = missatgeError(err, t("parada.visitError"));
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

  // mentre la petició no ha tornat encara no se sap si la parada existeix
  if (carregant) {
    return (
      <View
        accessibilityLabel={t("common.loading")}
        style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg }}
      >
        <ActivityIndicator size="small" color={COLORS.darkBg} />
      </View>
    );
  }

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
  const totalParades = totes.length || 10;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">

        {/* ---------- La parada: fotografia amb el títol a sobre ----------
             Tocar-la obre el mapa centrat en aquesta parada. El contenidor no
             es marca com a accessible perque no s'empassi el titol ni els
             controls que hi van a sobre; qui s'anuncia com a boto es la
             insignia "Veure al mapa" que hi ha dins del vel. */}
        <Pressable
          accessible={false}
          onPress={() => router.push({ pathname: "/(tabs)", params: { focus: parada.id } })}
          style={{ height: fotoHeight, backgroundColor: COLORS.darkBg }}
        >
          {fotoUrl && (
            <Image
              source={{ uri: fotoUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
              accessible
              accessibilityRole="image"
              accessibilityLabel={`${t("parada.photoOf")} ${parada.nom_espai}`}
              accessibilityIgnoresInvertColors
            />
          )}

          <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
            <View style={{ height: 28, backgroundColor: `rgba(${VEL_RGB},0.16)` }} />
            <View style={{ height: 26, backgroundColor: `rgba(${VEL_RGB},0.42)` }} />
            <View style={{ height: 22, backgroundColor: `rgba(${VEL_RGB},0.64)` }} />
            <View
              style={{
                backgroundColor: `rgba(${VEL_RGB},0.80)`,
                paddingHorizontal: 16,
                paddingTop: 4,
                paddingBottom: 16,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 10,
                  fontWeight: "600",
                  letterSpacing: 1.1,
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.88)",
                  marginBottom: 4,
                }}
                maxFontSizeMultiplier={1.4}
              >
                {t("parada.stopLabel")} {parada.ordre} / {totalParades}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 10 }}>
                <Text
                  accessibilityRole="header"
                  style={{
                    fontFamily: FONTS.serif,
                    fontSize: 24,
                    fontWeight: "600",
                    color: COLORS.onDark,
                    lineHeight: 30,
                    flex: 1,
                  }}
                  maxFontSizeMultiplier={1.4}
                >
                  {parada.nom_espai}
                </Text>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`${t("parada.viewOnMap")}: ${parada.nom_espai}`}
                  onPress={() => router.push({ pathname: "/(tabs)", params: { focus: parada.id } })}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    paddingHorizontal: 11,
                    minHeight: 36,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.45)",
                  }}
                >
                  <Ionicons name="location-outline" size={14} color={COLORS.onDark} />
                  <Text
                    style={{ fontFamily: FONTS.sans, fontSize: 10, fontWeight: "500", color: COLORS.onDark }}
                    maxFontSizeMultiplier={1.3}
                  >
                    {t("parada.map")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View
            style={{
              position: "absolute",
              top: insets.top + 8,
              left: 12,
            }}
          >
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t("parada.back")}
              onPress={() => router.back()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: `rgba(${VEL_RGB},0.80)`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="chevron-back" size={20} color={COLORS.onDark} />
            </TouchableOpacity>

          </View>
        </Pressable>

        {/* ---------- Els textos de la parada ---------- */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          {textos.length > 1 && (
            <Text
              accessibilityRole="header"
              style={[ROTUL_SECCIO, { marginBottom: 10 }]}
              maxFontSizeMultiplier={1.4}
            >
              {textos.length} {t("parada.textsHere")}
            </Text>
          )}

          {textos.map((tx) => (
            <TextCard
              key={tx.id}
              text={tx}
              audioRecursId={audioPerText[tx.id] ?? null}
              expandit={expandits.has(tx.id)}
              onToggle={() => toggleText(tx.id)}
              liked={likes[tx.id]?.liked ?? false}
              likesCount={likes[tx.id]?.count ?? 0}
              onLike={() => handleLike(tx.id)}
            />
          ))}
        </View>

        {/* ---------- La parada: marcar com a visitada ---------- */}
        <View style={{ paddingHorizontal: 16, marginTop: 6 }}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={visitant ? t("parada.visited") : t("parada.markVisited")}
            accessibilityState={{ disabled: visitLoading || visitant, checked: visitant }}
            onPress={handleVisitar}
            disabled={visitLoading || visitant}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              minHeight: 48,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: visitant ? COLORS.accent : COLORS.darkBg,
              backgroundColor: visitant ? COLORS.visitedBg : COLORS.darkBg,
            }}
          >
            {visitLoading ? (
              <ActivityIndicator size="small" color={COLORS.bg} />
            ) : (
              <>
                <Ionicons
                  name={visitant ? "checkmark-circle" : "location-outline"}
                  size={17}
                  color={visitant ? COLORS.accent : COLORS.bg}
                />
                <Text
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 13,
                    fontWeight: "500",
                    color: visitant ? COLORS.accent : COLORS.bg,
                  }}
                  maxFontSizeMultiplier={1.4}
                >
                  {visitant ? t("parada.visited") : t("parada.markVisited")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ---------- La parada: comentaris, plegats per defecte ---------- */}
        <View style={{ marginTop: 20, borderTopWidth: 1, borderTopColor: COLORS.border }}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`${t("parada.comments")}, ${comentaris.length}`}
            accessibilityState={{ expanded: comentarisOberts }}
            onPress={() => setComentarisOberts((v) => !v)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              minHeight: 52,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text
                style={{ fontFamily: FONTS.sans, fontSize: 13, fontWeight: "500", color: COLORS.text }}
                maxFontSizeMultiplier={1.5}
              >
                {t("parada.comments")}
              </Text>
              <View
                style={{
                  minWidth: 22,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 11,
                  backgroundColor: COLORS.lightBg,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontFamily: FONTS.sans, fontSize: 11, fontWeight: "600", color: COLORS.textSecondary }}
                  maxFontSizeMultiplier={1.3}
                >
                  {comentaris.length}
                </Text>
              </View>
            </View>
            <Ionicons
              name={comentarisOberts ? "chevron-up" : "chevron-down"}
              size={17}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          {comentarisOberts && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
              <View style={{ flexDirection: "row", gap: 6, marginBottom: 12 }}>
                <TextInput
                  accessibilityLabel={t("parada.commentPlaceholder")}
                  placeholder={t("parada.commentPlaceholder")}
                  placeholderTextColor={COLORS.textSecondary}
                  value={nouComentari}
                  onChangeText={setNouComentari}
                  multiline
                  blurOnSubmit
                  maxFontSizeMultiplier={1.5}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: COLORS.controlBorder,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontFamily: FONTS.sans,
                    fontSize: 12,
                    color: COLORS.text,
                    backgroundColor: COLORS.lightBg,
                    maxHeight: 96,
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
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    justifyContent: "center",
                    opacity: enviantComentari || !nouComentari.trim() ? 0.45 : 1,
                    minWidth: 44,
                    minHeight: 44,
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

              {comentaris.length === 0 ? (
                <Text
                  accessibilityRole="text"
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 12,
                    color: COLORS.textSecondary,
                    fontStyle: "italic",
                    paddingBottom: 8,
                  }}
                  maxFontSizeMultiplier={1.5}
                >
                  {t("parada.noComments")}
                </Text>
              ) : (
                comentaris.map((c) => (
                  <View
                    key={c.id}
                    style={{
                      paddingVertical: 10,
                      borderTopWidth: 1,
                      borderTopColor: COLORS.border,
                      gap: 6,
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <View style={{ flex: 1 }}>
                        {user?.rol === "ADMINISTRADOR" && c.usuari_id ? (
                          <TouchableOpacity
                            accessibilityRole="link"
                            accessibilityLabel={`${t("parada.viewUser")}: ${c.usuari_nom ?? ""} ${c.usuari_cognom ?? ""}`}
                            onPress={() => router.push(`/(admin)/usuaris?resaltar=${c.usuari_id}`)}
                            style={{ minHeight: 24, justifyContent: "center" }}
                          >
                            <Text
                              style={{ fontFamily: FONTS.sans, fontSize: 12, fontWeight: "600", color: COLORS.accent }}
                              maxFontSizeMultiplier={1.4}
                            >
                              {c.usuari_nom ?? t("parada.user")} {c.usuari_cognom ?? ""}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          c.usuari_nom && (
                            <Text
                              style={{ fontFamily: FONTS.sans, fontSize: 12, fontWeight: "600", color: COLORS.text }}
                              maxFontSizeMultiplier={1.4}
                            >
                              {c.usuari_nom} {c.usuari_cognom ?? ""}
                            </Text>
                          )
                        )}
                        <Text
                          style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary }}
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
                          <Ionicons name="trash-outline" size={16} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text
                      accessibilityRole="text"
                      style={{ fontFamily: FONTS.sans, fontSize: 12, color: COLORS.text, lineHeight: 18 }}
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
                          borderRadius: 8,
                          padding: 10,
                          borderLeftWidth: 2,
                          borderLeftColor: COLORS.accent,
                        }}
                      >
                        <Text
                          style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.accent, marginBottom: 3 }}
                          maxFontSizeMultiplier={1.3}
                        >
                          {t("parada.editorReply")}
                        </Text>
                        <Text
                          style={{ fontFamily: FONTS.sans, fontSize: 12, color: COLORS.text, lineHeight: 18 }}
                          maxFontSizeMultiplier={1.5}
                        >
                          {c.resposta_editor}
                        </Text>
                      </View>
                    ) : (
                      potModerar && (
                        <View style={{ flexDirection: "row", gap: 6 }}>
                          <TextInput
                            accessibilityLabel={`${t("parada.replyPlaceholder")}: ${c.contingut}`}
                            placeholder={t("parada.replyPlaceholder")}
                            placeholderTextColor={COLORS.textSecondary}
                            value={respostesModeracio[c.id] ?? ""}
                            onChangeText={(valor) =>
                              setRespostesModeracio((prev) => ({ ...prev, [c.id]: valor }))
                            }
                            maxFontSizeMultiplier={1.5}
                            style={{
                              flex: 1,
                              borderWidth: 1,
                              borderColor: COLORS.controlBorder,
                              borderRadius: 8,
                              paddingHorizontal: 10,
                              paddingVertical: 8,
                              fontFamily: FONTS.sans,
                              fontSize: 12,
                              color: COLORS.text,
                              minHeight: 44,
                            }}
                          />
                          <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel={t("common.send")}
                            accessibilityState={{
                              disabled: enviantResposta === c.id || !(respostesModeracio[c.id] ?? "").trim(),
                            }}
                            onPress={() => handleRespondreComentari(c.id)}
                            disabled={enviantResposta === c.id || !(respostesModeracio[c.id] ?? "").trim()}
                            style={{
                              backgroundColor: COLORS.darkBg,
                              borderRadius: 8,
                              paddingHorizontal: 14,
                              justifyContent: "center",
                              opacity:
                                enviantResposta === c.id || !(respostesModeracio[c.id] ?? "").trim() ? 0.45 : 1,
                              minHeight: 44,
                              minWidth: 44,
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
                      )
                    )}
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        {/* ---------- La ruta: parada anterior i següent ---------- */}
        {(prevParada || nextParada) && (
          <View
            accessibilityRole="toolbar"
            style={{
              flexDirection: "row",
              gap: 8,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 24,
              borderTopWidth: 1,
              borderTopColor: COLORS.border,
            }}
          >
            {prevParada && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`${t("parada.prevStop")}: ${prevParada.nom_espai}`}
                onPress={() => router.replace(`/parada/${prevParada.id}`)}
                style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44 }}
              >
                <Ionicons name="chevron-back" size={14} color={COLORS.textSecondary} />
                <Text
                  style={{ fontFamily: FONTS.sans, fontSize: 11, color: COLORS.textSecondary, flex: 1 }}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.4}
                >
                  {prevParada.nom_espai}
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
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 4,
                  minHeight: 44,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 11,
                    color: COLORS.text,
                    textAlign: "right",
                    flexShrink: 1,
                  }}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.4}
                >
                  {nextParada.nom_espai}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.text} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
