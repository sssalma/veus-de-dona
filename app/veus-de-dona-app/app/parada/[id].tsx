import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image, Dimensions,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import { COLORS, FONTS } from "../../constants";
import { getParada, getParades, getParadaFoto } from "../../services/parades";
import { getTextosByParada } from "../../services/textos";
import { checkLike, addLike, removeLike } from "../../services/likes";
import { getMevesVisites, registrarVisita } from "../../services/visites";
import { getComentaris, afegirComentari } from "../../services/comentaris";
import { useAuth } from "../../contexts/AuthContext";
import { Parada, TextDto, Comentari } from "../../types";

const ACCESSIBLE_FONT = Platform.select({ ios: "DMSans", android: "DMSans" }) ?? "DMSans";

export default function ParadaScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [parada, setParada] = useState<Parada | null>(null);
  const [textos, setTextos] = useState<TextDto[]>([]);
  const [totes, setTotes] = useState<Parada[]>([]);
  const [textSeleccionat, setTextSeleccionat] = useState(0);
  const [textExpandit, setTextExpandit] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [visitant, setVisitant] = useState(false);
  const [comentaris, setComentaris] = useState<Comentari[]>([]);
  const [nouComentari, setNouComentari] = useState("");
  const [enviantComentari, setEnviantComentari] = useState(false);
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
      if (visites.some((v) => v.parada_id === pid)) setVisitant(true);
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
      Alert.alert("Inicia sessió", "Has d'iniciar sessió per donar likes");
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
      Alert.alert("Error", "No s'ha pogut processar el like");
    }
  };

  const handleVisitar = async () => {
    if (!isAuthenticated) {
      Alert.alert("Inicia sessió", "Has d'iniciar sessió per marcar visitada");
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
      Alert.alert("Fet!", "Parada marcada com a visitada");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Error en registrar la visita";
      Alert.alert("Error", msg);
    } finally {
      setVisitLoading(false);
    }
  };

  const handleAfegirComentari = async () => {
    if (!nouComentari.trim()) return;
    if (!isAuthenticated) {
      Alert.alert("Inicia sessió", "Has d'iniciar sessió per comentar");
      return;
    }
    setEnviantComentari(true);
    try {
      const comentari = await afegirComentari(id as string, nouComentari.trim());
      setComentaris((prev) => [comentari, ...prev]);
      setNouComentari("");
    } catch {
      Alert.alert("Error", "No s'ha pogut afegir el comentari");
    } finally {
      setEnviantComentari(false);
    }
  };

  if (!parada) {
    return (
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel="Parada no trobada"
        style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg }}
      >
        <Text
          style={{ fontFamily: FONTS.sans, color: COLORS.textSecondary, fontSize: 14 }}
          maxFontSizeMultiplier={1.5}
        >
          Parada no trobada
        </Text>
      </View>
    );
  }

  const idx = totes.findIndex((p) => p.id === id);
  const prevParada = idx > 0 ? totes[idx - 1] : null;
  const nextParada = idx < totes.length - 1 ? totes[idx + 1] : null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View
        accessibilityRole="header"
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          minHeight: 44,
        }}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Tornar al mapa"
          onPress={() => router.back()}
          style={{ minWidth: 44, minHeight: 44, justifyContent: "center" }}
        >
          <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary }} maxFontSizeMultiplier={1.4}>
            ← Mapa
          </Text>
        </TouchableOpacity>
        <View
          accessibilityRole="text"
          accessibilityLabel={`Parada ${parada.ordre} de 10`}
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
            PARADA {parada.ordre} / 10
          </Text>
        </View>
        <View
          accessibilityRole="text"
          accessibilityLabel="Mode guiat"
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
            Guiat
          </Text>
        </View>
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
            <Text
              accessibilityRole="header"
              style={{
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
                accessibilityLabel={liked ? "Treure like" : "Donar like"}
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
                  {likesCount > 0 ? likesCount : "M'agrada"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Escoltar àudio"
                style={{
                  flex: 1,
                  backgroundColor: COLORS.darkBg,
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
                    color: COLORS.bg,
                    textAlign: "center",
                  }}
                  maxFontSizeMultiplier={1.4}
                >
                  ▶ Àudio
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Veure vídeo"
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
                  🎬 Vídeo
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={textExpandit ? "Mostrar menys text" : "Llegir tot el text"}
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
              {textExpandit ? "mostrar menys ↑" : "llegir tot el text ↓"}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={visitant ? "Parada ja visitada" : "Marcar com a visitada"}
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
              {visitant ? "Visitada" : "Marcar com a visitada"}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {prevParada && (
        <View
          accessibilityRole="toolbar"
          style={{ flexDirection: "row", gap: 6, paddingHorizontal: 14, paddingVertical: 6 }}
        >
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Parada anterior: ${prevParada.nom_espai}`}
            onPress={() => router.push(`/parada/${prevParada.id}`)}
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
          {nextParada && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Següent parada: ${nextParada.nom_espai}`}
              onPress={() => router.push(`/parada/${nextParada.id}`)}
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
                Parada {nextParada.ordre}
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
            Comentaris
          </Text>
          <View
            accessibilityRole="text"
            accessibilityLabel={`${comentaris.length} comentaris`}
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
            accessibilityLabel="Escriu un comentari"
            placeholder="Afegeix un comentari..."
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
            accessibilityLabel="Enviar comentari"
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
              Enviar
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
            No hi ha comentaris. Sigues el primer!
          </Text>
        ) : (
          comentaris.map((c) => (
            <View
              key={c.id}
              accessibilityRole="text"
              style={{
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: "#e0dcd0",
                minHeight: 44,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 9,
                  color: COLORS.textSecondary,
                  marginBottom: 2,
                }}
                maxFontSizeMultiplier={1.3}
              >
                {new Date(c.data_creacio).toLocaleDateString("ca-ES", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <Text
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
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
