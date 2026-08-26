import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { Idioma } from "../../i18n/translations";
import { getMevesVisites } from "../../services/visites";
import { getParades } from "../../services/parades";
import { Parada, Visita } from "../../types";

const IDIOMES: Idioma[] = ["CA", "ES", "EN"];
const MODES: ("GUIAT" | "LLIURE" | "REMOT")[] = ["GUIAT", "LLIURE", "REMOT"];

const LOCALE_PER_IDIOMA: Record<string, string> = {
  CA: "ca-ES",
  ES: "es-ES",
  EN: "en-GB",
};

/**
 * El perfil com a diari de la ruta.
 *
 * En lloc d'una llista de preferències, la pantalla explica el recorregut de
 * qui la mira: quantes parades porta, de quina manera les ha fet, quina li toca
 * ara i quan va passar per cadascuna. Les preferències hi són, però al final,
 * perquè no són el motiu pel qual s'obre aquesta pantalla.
 */
export default function PerfilScreen() {
  const router = useRouter();
  // Tots els hooks abans de qualsevol return condicional: si un queda per sota,
  // el nombre de hooks canvia entre renders i React llança un error.
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { t, idioma, canviarIdioma } = useLanguage();
  const [parades, setParades] = useState<Parada[]>([]);
  const [visites, setVisites] = useState<Visita[]>([]);

  useFocusEffect(
    useCallback(() => {
      getParades()
        .then((rebudes) => setParades([...rebudes].sort((a, b) => a.ordre - b.ordre)))
        .catch(() => {});
      if (!isAuthenticated) {
        setVisites([]);
        return;
      }
      getMevesVisites().then(setVisites).catch(() => {});
    }, [isAuthenticated])
  );

  if (isLoading) {
    return (
      <View
        accessibilityLabel={t("common.loading")}
        style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg }}
      >
        <ActivityIndicator size="small" color={COLORS.darkBg} />
      </View>
    );
  }

  const locale = LOCALE_PER_IDIOMA[idioma] ?? "ca-ES";
  const visitaPerParada: Record<string, Visita> = {};
  visites.forEach((v) => { visitaPerParada[v.parada_id] = v; });

  const fetes = parades.filter((p) => visitaPerParada[p.id]);
  const propera = parades.find((p) => !visitaPerParada[p.id]) ?? null;
  const completada = parades.length > 0 && fetes.length === parades.length;
  const percentatge = parades.length ? (fetes.length / parades.length) * 100 : 0;

  const perMode = MODES.map((m) => ({
    mode: m,
    total: fetes.filter((p) => visitaPerParada[p.id].mode === m).length,
  })).filter((x) => x.total > 0);

  const inicials = user ? `${user.nom[0]}${user.cognom[0]}`.toUpperCase() : "?";
  const rolEtiqueta =
    user?.rol === "ADMINISTRADOR"
      ? t("perfil.administrador")
      : user?.rol === "EDITOR"
        ? t("perfil.editor")
        : t("perfil.visitant");

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>

        {/* ---------- qui ets ---------- */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            paddingHorizontal: 18,
            paddingTop: insets.top + 20,
            paddingBottom: 20,
          }}
        >
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 29,
              backgroundColor: COLORS.darkBg,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{ fontFamily: FONTS.serif, fontSize: 20, color: COLORS.bg }}
              maxFontSizeMultiplier={1.3}
            >
              {inicials}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              accessibilityRole="header"
              style={{ fontFamily: FONTS.serif, fontSize: 21, color: COLORS.text, lineHeight: 26 }}
              maxFontSizeMultiplier={1.4}
            >
              {user ? `${user.nom} ${user.cognom}` : t("perfil.guest")}
            </Text>
            <Text
              style={{ fontFamily: FONTS.sans, fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}
              maxFontSizeMultiplier={1.4}
            >
              {user?.email ?? t("perfil.noSession")}
            </Text>
            {user && (
              <View
                style={{
                  marginTop: 6,
                  alignSelf: "flex-start",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  backgroundColor: COLORS.badgeBg,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 9,
                    fontWeight: "700",
                    letterSpacing: 0.7,
                    textTransform: "uppercase",
                    color: COLORS.badgeText,
                  }}
                  maxFontSizeMultiplier={1.3}
                >
                  {rolEtiqueta}
                </Text>
              </View>
            )}
          </View>
        </View>

        {!isAuthenticated ? (
          /* ---------- convidada: una invitació, no un perfil buit ---------- */
          <View style={{ paddingHorizontal: 18, gap: 14 }}>
            <View
              style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 12,
                padding: 18,
                gap: 10,
              }}
            >
              <Text
                style={{ fontFamily: FONTS.serif, fontSize: 16, color: COLORS.text, lineHeight: 23 }}
                maxFontSizeMultiplier={1.5}
              >
                {t("perfil.guestInvite")}
              </Text>
              <Text
                style={{ fontFamily: FONTS.sans, fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 }}
                maxFontSizeMultiplier={1.5}
              >
                {t("perfil.guestInviteBody")}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t("auth.loginButton")}
                onPress={() => router.push("/login")}
                style={{
                  marginTop: 4,
                  backgroundColor: COLORS.darkBg,
                  borderRadius: 8,
                  minHeight: 46,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ fontFamily: FONTS.sans, fontSize: 12, fontWeight: "500", color: COLORS.bg }}
                  maxFontSizeMultiplier={1.4}
                >
                  {t("auth.loginButton")}
                </Text>
              </TouchableOpacity>
            </View>
            <SelectorIdioma idioma={idioma} canviarIdioma={canviarIdioma} etiqueta={t("perfil.language")} />
          </View>
        ) : (
          <>
            {/* ---------- el recorregut ---------- */}
            <View style={{ paddingHorizontal: 18, paddingBottom: 18 }}>
              <Rotul text={t("perfil.myRoute")} />

              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                <Text
                  style={{ fontFamily: FONTS.serif, fontSize: 40, color: COLORS.accent, lineHeight: 46 }}
                  maxFontSizeMultiplier={1.3}
                >
                  {fetes.length}
                </Text>
                <Text
                  style={{ fontFamily: FONTS.sans, fontSize: 13, color: COLORS.textSecondary }}
                  maxFontSizeMultiplier={1.4}
                >
                  / {parades.length} {t("perfil.stops")}
                </Text>
              </View>

              <View
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: parades.length, now: fetes.length }}
                style={{
                  height: 6,
                  backgroundColor: COLORS.border,
                  borderRadius: 3,
                  overflow: "hidden",
                  marginTop: 10,
                }}
              >
                <View
                  style={{ height: "100%", width: `${percentatge}%`, backgroundColor: COLORS.accent, borderRadius: 3 }}
                />
              </View>

              {perMode.length > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
                  {perMode.map(({ mode, total }) => (
                    <Text
                      key={mode}
                      style={{ fontFamily: FONTS.sans, fontSize: 11, color: COLORS.textSecondary }}
                      maxFontSizeMultiplier={1.4}
                    >
                      <Text style={{ fontWeight: "700", color: COLORS.text }}>{total}</Text>
                      {" "}
                      {mode === "GUIAT"
                        ? t("parada.mode.GUIAT")
                        : mode === "LLIURE"
                          ? t("parada.mode.LLIURE")
                          : t("parada.mode.REMOT")}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            {/* ---------- què toca ara ---------- */}
            <View style={{ paddingHorizontal: 18, paddingBottom: 20 }}>
              {completada ? (
                <View
                  accessibilityRole="text"
                  accessibilityLabel={t("perfil.routeComplete")}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    borderWidth: 1,
                    borderColor: COLORS.accent,
                    backgroundColor: COLORS.visitedBg,
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <Ionicons name="ribbon-outline" size={22} color={COLORS.accent} />
                  <Text
                    style={{ fontFamily: FONTS.serif, fontSize: 15, color: COLORS.accent, flex: 1, lineHeight: 21 }}
                    maxFontSizeMultiplier={1.4}
                  >
                    {t("perfil.routeComplete")}
                  </Text>
                </View>
              ) : propera ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`${t("perfil.nextStop")}: ${propera.ordre}. ${propera.nom_espai}`}
                  onPress={() => router.push(`/parada/${propera.id}`)}
                  style={{
                    borderWidth: 1,
                    borderColor: COLORS.controlBorder,
                    borderRadius: 12,
                    padding: 16,
                    gap: 4,
                    minHeight: 44,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: 9,
                      fontWeight: "700",
                      letterSpacing: 0.9,
                      textTransform: "uppercase",
                      color: COLORS.textSecondary,
                    }}
                    maxFontSizeMultiplier={1.3}
                  >
                    {fetes.length === 0 ? t("perfil.startHere") : t("perfil.nextStop")}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text
                      style={{ fontFamily: FONTS.serif, fontSize: 17, color: COLORS.text, flex: 1, lineHeight: 23 }}
                      maxFontSizeMultiplier={1.4}
                    >
                      {propera.ordre}. {propera.nom_espai}
                    </Text>
                    <Ionicons name="arrow-forward" size={17} color={COLORS.accent} />
                  </View>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* ---------- el diari: parada a parada ---------- */}
            {parades.length > 0 && (
              <View style={{ paddingHorizontal: 18, paddingBottom: 22 }}>
                <Rotul text={t("perfil.theStops")} />
                <View style={{ marginTop: 8 }}>
                  {parades.map((p) => {
                    const visita = visitaPerParada[p.id];
                    const etiquetaMode = visita
                      ? visita.mode === "GUIAT"
                        ? t("parada.mode.GUIAT")
                        : visita.mode === "LLIURE"
                          ? t("parada.mode.LLIURE")
                          : t("parada.mode.REMOT")
                      : "";
                    return (
                      <TouchableOpacity
                        key={p.id}
                        accessibilityRole="button"
                        accessibilityLabel={
                          visita
                            ? `${p.ordre}. ${p.nom_espai}. ${t("perfil.visited")}, ${etiquetaMode}`
                            : `${p.ordre}. ${p.nom_espai}. ${t("perfil.pending")}`
                        }
                        onPress={() => router.push(`/parada/${p.id}`)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                          minHeight: 48,
                          paddingVertical: 8,
                          borderBottomWidth: 1,
                          borderBottomColor: COLORS.border,
                        }}
                      >
                        <View
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 13,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: visita ? COLORS.accent : "transparent",
                            borderWidth: visita ? 0 : 1,
                            borderColor: COLORS.controlBorder,
                          }}
                        >
                          {visita ? (
                            <Ionicons name="checkmark" size={15} color={COLORS.bg} />
                          ) : (
                            <Text
                              style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary }}
                              maxFontSizeMultiplier={1.2}
                            >
                              {p.ordre}
                            </Text>
                          )}
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontFamily: FONTS.sans,
                              fontSize: 13,
                              fontWeight: visita ? "500" : "400",
                              color: visita ? COLORS.text : COLORS.textSecondary,
                            }}
                            numberOfLines={1}
                            maxFontSizeMultiplier={1.4}
                          >
                            {p.nom_espai}
                          </Text>
                          {visita && (
                            <Text
                              style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary, marginTop: 1 }}
                              maxFontSizeMultiplier={1.3}
                            >
                              {new Date(visita.timestamp).toLocaleDateString(locale, {
                                day: "numeric",
                                month: "long",
                              })}
                              {" · "}
                              {etiquetaMode}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ---------- preferències ---------- */}
            <View style={{ paddingHorizontal: 18, paddingBottom: 18 }}>
              <Rotul text={t("perfil.preferences")} />
              <View style={{ marginTop: 6 }}>
                <SelectorIdioma idioma={idioma} canviarIdioma={canviarIdioma} etiqueta={t("perfil.language")} />
                <Fila etiqueta={t("perfil.origin")} valor={user?.procedencia ?? "—"} />
                <Fila
                  etiqueta={t("perfil.schoolGroup")}
                  valor={user?.es_alumne ? t("perfil.yes") : t("perfil.no")}
                />
              </View>
            </View>

            {/* ---------- accions ---------- */}
            <View style={{ paddingHorizontal: 18, gap: 2 }}>
              <Accio
                etiqueta={t("perfil.editProfile")}
                icona="create-outline"
                onPress={() => router.push("/editar-perfil")}
              />
              {user && user.rol !== "VISITANT" && (
                <Accio
                  etiqueta={t("perfil.adminPanel")}
                  icona="grid-outline"
                  onPress={() => router.push("/(admin)")}
                />
              )}
              <Accio
                etiqueta={t("perfil.logout")}
                icona="log-out-outline"
                color={COLORS.love}
                onPress={async () => { await logout(); router.replace("/login"); }}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Rotul({ text }: { text: string }) {
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontFamily: FONTS.sans,
        fontSize: 9,
        fontWeight: "700",
        letterSpacing: 1,
        textTransform: "uppercase",
        color: COLORS.textSecondary,
      }}
      maxFontSizeMultiplier={1.4}
    >
      {text}
    </Text>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`${etiqueta}: ${valor}`}
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        minHeight: 46,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
      }}
    >
      <Text
        style={{ fontFamily: FONTS.sans, fontSize: 12, color: COLORS.text }}
        maxFontSizeMultiplier={1.5}
      >
        {etiqueta}
      </Text>
      <Text
        style={{ fontFamily: FONTS.sans, fontSize: 12, color: COLORS.textSecondary }}
        maxFontSizeMultiplier={1.5}
      >
        {valor}
      </Text>
    </View>
  );
}

function SelectorIdioma({
  idioma,
  canviarIdioma,
  etiqueta,
}: {
  idioma: Idioma;
  canviarIdioma: (nou: Idioma) => void;
  etiqueta: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        minHeight: 46,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
      }}
    >
      <Text
        style={{ fontFamily: FONTS.sans, fontSize: 12, color: COLORS.text }}
        maxFontSizeMultiplier={1.5}
      >
        {etiqueta}
      </Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={etiqueta} style={{ flexDirection: "row", gap: 6 }}>
        {IDIOMES.map((codi) => {
          const selected = codi === idioma;
          return (
            <TouchableOpacity
              key={codi}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${etiqueta} ${codi}`}
              hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
              onPress={() => canviarIdioma(codi)}
              style={{
                paddingHorizontal: 11,
                paddingVertical: 6,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: selected ? COLORS.darkBg : COLORS.controlBorder,
                backgroundColor: selected ? COLORS.darkBg : "transparent",
                minHeight: 32,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 10,
                  fontWeight: selected ? "600" : "400",
                  color: selected ? COLORS.bg : COLORS.textSecondary,
                }}
                maxFontSizeMultiplier={1.3}
              >
                {codi}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function Accio({
  etiqueta,
  icona,
  onPress,
  color = COLORS.text,
}: {
  etiqueta: string;
  icona: any;
  onPress: () => void;
  color?: string;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        minHeight: 50,
      }}
    >
      <Ionicons name={icona} size={17} color={color} />
      <Text
        style={{ fontFamily: FONTS.sans, fontSize: 13, color, flex: 1 }}
        maxFontSizeMultiplier={1.5}
      >
        {etiqueta}
      </Text>
      <Ionicons name="chevron-forward" size={15} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
}
