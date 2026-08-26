import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS, ROTUL_SECCIO, TITOL_PANTALLA } from "../../constants";
import { getAutora, getAutoraFoto } from "../../services/autores";
import { getTextosByAutora } from "../../services/textos";
import { getParades } from "../../services/parades";
import { Autora, Parada, TextDto } from "../../types";
import { Capcalera } from "../../components/Capcalera";
import CopyButton from "../../components/CopyButton";
import { useLanguage } from "../../contexts/LanguageContext";

export default function AutoraScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [autora, setAutora] = useState<Autora | null>(null);
  const [textos, setTextos] = useState<TextDto[]>([]);
  const [totesParades, setTotesParades] = useState<Parada[]>([]);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const aid = id as string;
    getAutora(aid).then(setAutora).catch(() => setAutora(null));
    getTextosByAutora(aid).then(setTextos).catch(() => setTextos([]));
    getParades().then(setTotesParades).catch(() => setTotesParades([]));
    // 404 si l'autora encara no té retrat: es cau a les inicials
    getAutoraFoto(aid).then(setFotoUrl).catch(() => setFotoUrl(null));
  }, [id]);

  if (!autora) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg }}>
        <Text maxFontSizeMultiplier={1.5} style={{ fontFamily: FONTS.sans, color: COLORS.textSecondary }}>
          {t("autora.notFound")}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <Capcalera titol={t("autora.title")} />

      <View
        style={{
          padding: 14,
          flexDirection: "row",
          gap: 12,
          alignItems: "flex-start",
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <View
          accessibilityRole="image"
          accessibilityLabel={`${t("autora.portraitOf")} ${autora.nom} ${autora.cognom}`}
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: COLORS.darkBg,
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          {fotoUrl ? (
            <Image
              source={{ uri: fotoUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <Text
              style={{
                fontFamily: FONTS.serif,
                fontSize: 16,
                color: COLORS.bg,
              }}
              maxFontSizeMultiplier={1.3}
            >
              {autora.nom[0]}
              {autora.cognom[0]}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text maxFontSizeMultiplier={1.5}
            style={{
              fontFamily: FONTS.serif,
              fontSize: 14,
              fontWeight: "600",
              color: COLORS.text,
            }}
          >
            {autora.nom} {autora.cognom}
          </Text>
          {autora.anys_vida && (
            <Text maxFontSizeMultiplier={1.5}
              style={{
                fontFamily: FONTS.sans,
                fontSize: 9,
                color: COLORS.textSecondary,
                marginTop: 2,
              }}
            >
              {autora.anys_vida}
            </Text>
          )}
          {/* Aquí hi havia dues etiquetes fixes, "Poesia" i "Narrativa", que es
              mostraven idèntiques per a totes les autores sense provenir de cap
              dada. En comptes d'inventar-les, s'ensenya el nombre de textos que
              l'autora té a la ruta, que sí que és una dada real. */}
          {textos.length > 0 && (
            <View
              accessibilityRole="text"
              accessibilityLabel={`${textos.length} ${t("autora.textsInRoute")}`}
              style={{
                marginTop: 6,
                alignSelf: "flex-start",
                paddingHorizontal: 7,
                paddingVertical: 3,
                backgroundColor: COLORS.tagBg,
                borderRadius: 10,
              }}
            >
              <Text
                style={{ fontFamily: FONTS.sans, fontSize: 9, color: COLORS.tagText }}
                maxFontSizeMultiplier={1.3}
              >
                {textos.length} {textos.length === 1 ? t("autora.textSingular") : t("autora.textPlural")}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <Text maxFontSizeMultiplier={1.5}
            style={ROTUL_SECCIO}
          >
            {t("autora.bio")}
          </Text>
          {autora.bio && <CopyButton text={autora.bio} />}
        </View>
        <Text maxFontSizeMultiplier={1.5}
          style={{
            fontFamily: FONTS.sans,
            fontSize: 12,
            color: COLORS.text,
            lineHeight: 19,
          }}
        >
          {autora.bio}
        </Text>
      </View>

      <View style={{ padding: 14 }}>
        <Text maxFontSizeMultiplier={1.5}
          style={[ROTUL_SECCIO, { marginBottom: 6 }]}
        >
          {t("autora.textsInRoute")}
        </Text>
        {textos.map((texto) => {
          const parada = totesParades.find((p) => p.id === texto.parada_id);
          return (
            <TouchableOpacity
              key={texto.id}
              accessibilityRole="button"
              accessibilityLabel={`${texto.titol}${parada ? `, ${t("autora.stop")} ${parada.ordre}` : ""}`}
              onPress={() => router.push(`/parada/${texto.parada_id}`)}
              style={{
                borderWidth: 1,
                borderColor: COLORS.controlBorder,
                borderRadius: 6,
                padding: 10,
                marginBottom: 6,
              }}
            >
              <Text maxFontSizeMultiplier={1.5}
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 11,
                  fontWeight: "500",
                  color: COLORS.text,
                }}
              >
                {texto.titol}
              </Text>
              <Text maxFontSizeMultiplier={1.5} style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary, marginTop: 2 }}>
                {parada ? `${texto.obra_origen} · ${t("autora.stop")} ${parada.ordre}` : texto.obra_origen}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
