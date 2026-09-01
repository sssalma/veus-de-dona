import { View, Text, TouchableOpacity, Pressable, Linking } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "../constants";
import { useLanguage } from "../contexts/LanguageContext";
import { TextDto } from "../types";
import AudioPlayer from "./AudioPlayer";
import CopyButton from "./CopyButton";

interface TextCardProps {
  text: TextDto;
  /** Recurs d'àudio vinculat a aquest text, si en té */
  audioRecursId: string | null;
  expandit: boolean;
  onToggle: () => void;
  liked: boolean;
  likesCount: number;
  onLike: () => void;
}

/**
 * Un text de la ruta, amb tot el que li pertany.
 *
 * L'àudio, el vídeo i el "m'agrada" són característiques del text concret, no
 * de la parada, i per això viuen aquí dins i es pleguen amb ell. Quan el text
 * està plegat només se n'anuncia l'existència amb indicadors passius.
 *
 * Repartiment dins del text obert:
 *   - a dalt, l'àudio: s'engega i s'acompanya la lectura
 *   - a baix, les reaccions: ja s'ha llegit el text
 *
 * Tota la targeta obre i tanca. Com que la capçalera és el disparador, el nom
 * de l'autora no pot ser alhora l'enllaç a la seva fitxa: l'enllaç viu al peu
 * del text obert.
 *
 * Accessibilitat: el contenidor tàctil es marca com a no accessible perquè no
 * absorbeixi els fills -si fos un sol element, el lector de pantalla no
 * arribaria ni al poema ni als botons-. Qui fa de botó anunciat és la
 * capçalera, que porta el rol, l'estat i el resum del que conté el text.
 */
export default function TextCard({
  text,
  audioRecursId,
  expandit,
  onToggle,
  liked,
  likesCount,
  onLike,
}: TextCardProps) {
  const router = useRouter();
  const { t, idioma } = useLanguage();
  const autora = text.autora;

  const trets = [
    audioRecursId ? t("parada.hasAudio") : null,
    text.youtube_url ? t("parada.hasVideo") : null,
    likesCount > 0 ? `${likesCount} ${t("parada.likeLabel")}` : null,
  ].filter(Boolean);

  const resum = [
    autora ? `${autora.nom} ${autora.cognom}` : "",
    text.titol,
    ...trets,
    expandit ? t("parada.closeText") : t("parada.readText"),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Pressable
      accessible={false}
      onPress={onToggle}
      style={({ pressed }) => [
        {
          borderWidth: 1,
          borderColor: expandit ? COLORS.controlBorder : COLORS.border,
          borderRadius: 10,
          marginBottom: 10,
          overflow: "hidden",
          backgroundColor: pressed ? COLORS.lightBg : "transparent",
        },
      ]}
    >
      {/* ---- capçalera: l'autora encapçala, i és qui fa de botó anunciat ---- */}
      <View
        accessible
        accessibilityRole="button"
        accessibilityState={{ expanded: expandit }}
        accessibilityLabel={resum}
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 10,
          paddingHorizontal: 14,
          paddingTop: 12,
          paddingBottom: 2,
          minHeight: 44,
        }}
      >
        <View style={{ flex: 1 }}>
          {autora && (
            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 0.9,
                textTransform: "uppercase",
                color: COLORS.text,
              }}
              maxFontSizeMultiplier={1.4}
            >
              {autora.nom} {autora.cognom}
            </Text>
          )}
          <Text
            style={{
              fontFamily: FONTS.serif,
              fontSize: 16,
              color: COLORS.text,
              marginTop: 3,
            }}
            maxFontSizeMultiplier={1.5}
          >
            {text.titol}
          </Text>
          {text.obra_origen && (
            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: 11,
                fontStyle: "italic",
                color: COLORS.textSecondary,
                marginTop: 1,
              }}
              maxFontSizeMultiplier={1.4}
            >
              {text.obra_origen}
            </Text>
          )}
        </View>
        <Ionicons
          name={expandit ? "chevron-up" : "chevron-down"}
          size={17}
          color={COLORS.textSecondary}
          style={{ marginTop: 2 }}
        />
      </View>

      {/* ---- plegat: tastet del vers i indicadors del que conté ---- */}
      {!expandit && (
        <View style={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: 14 }}>
          <Text
            accessibilityRole="text"
            style={{
              fontFamily: FONTS.serif,
              fontStyle: "italic",
              fontSize: 13,
              color: COLORS.textSecondary,
              lineHeight: 20,
            }}
            numberOfLines={2}
            maxFontSizeMultiplier={1.5}
          >
            {text.contingut}
          </Text>

          {/* Indicadors sense text: el que contenen ja s'anuncia al lector de
              pantalla dins l'etiqueta de la capçalera, de manera que aquí
              només han de servir per reconèixer-ho d'un cop d'ull. */}
          {trets.length > 0 && (
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 10,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                {audioRecursId && (
                  <Ionicons name="headset-outline" size={16} color={COLORS.textSecondary} />
                )}
                {text.youtube_url && (
                  <Ionicons name="videocam-outline" size={16} color={COLORS.textSecondary} />
                )}
              </View>
              {likesCount > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="heart" size={13} color={COLORS.love} />
                  <Text
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: 11,
                      fontWeight: "600",
                      color: COLORS.love,
                    }}
                    maxFontSizeMultiplier={1.3}
                  >
                    {likesCount}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* ---- obert: àudio a dalt, poema, reaccions a baix ---- */}
      {expandit && (
        <View style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14, gap: 12 }}>
          {audioRecursId && <AudioPlayer recursId={audioRecursId} />}

          <View style={{ borderLeftWidth: 2, borderLeftColor: COLORS.controlBorder, paddingLeft: 12 }}>
            <Text
              accessibilityRole="text"
              style={{
                fontFamily: FONTS.serif,
                fontStyle: "italic",
                fontSize: 14,
                color: COLORS.text,
                lineHeight: 23,
              }}
              maxFontSizeMultiplier={1.5}
            >
              {text.contingut}
            </Text>
          </View>

          {/* El web del projecte no publica totes les obres traduïdes. Quan
              en falta una arriba l'original: dir-ho és més honest que deixar
              que sembli que aquella obra és així en l'idioma triat. */}
          {text.contingut_idioma !== idioma && (
            <Text
              maxFontSizeMultiplier={1.5}
              style={{
                fontFamily: FONTS.sans,
                fontSize: 11,
                fontStyle: "italic",
                color: COLORS.textSecondary,
                lineHeight: 15,
              }}
            >
              {t("parada.textOriginal")}
            </Text>
          )}

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={
                liked
                  ? `${t("parada.removeLike")}, ${likesCount}`
                  : `${t("parada.giveLike")}, ${likesCount}`
              }
              accessibilityState={{ selected: liked }}
              onPress={onLike}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 14,
                minHeight: 44,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: liked ? COLORS.love : COLORS.controlBorder,
                backgroundColor: liked ? COLORS.likeBg : "transparent",
              }}
            >
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={16}
                color={liked ? COLORS.love : COLORS.text}
              />
              <Text
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 12,
                  fontWeight: "500",
                  color: liked ? COLORS.love : COLORS.text,
                }}
                maxFontSizeMultiplier={1.3}
              >
                {likesCount}
              </Text>
            </TouchableOpacity>

            {text.youtube_url && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t("parada.video")}
                onPress={() => Linking.openURL(text.youtube_url!)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 14,
                  minHeight: 44,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: COLORS.controlBorder,
                }}
              >
                <Ionicons name="videocam-outline" size={16} color={COLORS.text} />
                <Text
                  style={{ fontFamily: FONTS.sans, fontSize: 12, fontWeight: "500", color: COLORS.text }}
                  maxFontSizeMultiplier={1.3}
                >
                  {t("parada.video")}
                </Text>
              </TouchableOpacity>
            )}

            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <CopyButton text={`${text.titol}\n\n${text.contingut}`} />
            </View>
          </View>

          {autora && (
            <TouchableOpacity
              accessibilityRole="link"
              accessibilityLabel={`${t("parada.viewAuthor")}: ${autora.nom} ${autora.cognom}`}
              onPress={() => router.push(`/autora/${autora.id}`)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                minHeight: 44,
                borderTopWidth: 1,
                borderTopColor: COLORS.border,
                paddingTop: 4,
              }}
            >
              <Ionicons name="person-outline" size={14} color={COLORS.accent} />
              <Text
                style={{ fontFamily: FONTS.sans, fontSize: 12, fontWeight: "500", color: COLORS.accent }}
                maxFontSizeMultiplier={1.5}
              >
                {t("parada.viewAuthor")}
              </Text>
              <Ionicons name="chevron-forward" size={13} color={COLORS.accent} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </Pressable>
  );
}

