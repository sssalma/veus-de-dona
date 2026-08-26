import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { COLORS, FONTS } from "../../constants";
import { Rotul } from "../../components/Rotul";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { etiquetaMode, etiquetaRol, ordenaPer, ORDRE_MODES } from "../../i18n/etiquetes";
import { Capcalera } from "../../components/Capcalera";
import { getMetriquesGlobal } from "../../services/metriques";
import { MetriquesGlobal } from "../../types";

/**
 * Pantalla d'entrada del panell d'edició i administració.
 *
 * Responia a dues preguntes alhora sense resoldre'n cap: apilava tres taules
 * de mètriques en brut —amb els valors dels enums tal com venen del servidor—
 * i, a sota, sis enllaços d'aspecte idèntic. Calia recórrer tot el
 * desglossament abans d'arribar a cap acció.
 *
 * Ara la pantalla només orienta: dues xifres per saber en quin estat és la
 * ruta i un índex agrupat per saber on anar a treballar. El desglossament
 * complet viu a `metriques.tsx`, que és on té sentit mirar-lo amb calma.
 */
export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [metriques, setMetriques] = useState<MetriquesGlobal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getMetriquesGlobal()
        .then((dades) => {
          setMetriques(dades);
          setError(false);
        })
        .catch(() => {
          setMetriques(null);
          setError(true);
        })
        .finally(() => setLoading(false));
    }, [])
  );

  const totalVisites = metriques ? suma(metriques.visites_per_mode) : 0;
  const totalUsuaris = metriques ? suma(metriques.usuaris_per_rol) : 0;
  const perMode = metriques
    ? ordenaPer(metriques.visites_per_mode, ORDRE_MODES).filter(([, n]) => n > 0)
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>

        {/* ---------- qui ets i on ets ---------- */}
        <Capcalera
          titol={t("admin.title")}
          tornarA="perfil"
          dreta={
            user ? (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  backgroundColor: COLORS.badgeBg,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 10,
                    fontWeight: "700",
                    letterSpacing: 0.7,
                    textTransform: "uppercase",
                    color: COLORS.badgeText,
                  }}
                  maxFontSizeMultiplier={1.3}
                >
                  {etiquetaRol(t, user.rol)}
                </Text>
              </View>
            ) : null
          }
        />

        {/* ---------- d'un cop d'ull ---------- */}
        <View style={{ paddingHorizontal: 18, paddingTop: 20 }}>
          <Rotul text={t("admin.overview")} />

          {loading ? (
            <View
              accessibilityLabel={t("admin.loading")}
              style={{ paddingVertical: 22, alignItems: "flex-start" }}
            >
              <ActivityIndicator size="small" color={COLORS.accent} />
            </View>
          ) : error ? (
            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: 12,
                color: COLORS.textSecondary,
                fontStyle: "italic",
                marginTop: 10,
              }}
              maxFontSizeMultiplier={1.5}
            >
              {t("admin.dataUnavailable")}
            </Text>
          ) : (
            <>
              <View style={{ flexDirection: "row", gap: 18, marginTop: 6 }}>
                <Xifra valor={totalVisites} etiqueta={t("admin.visits")} />
                <Xifra valor={totalUsuaris} etiqueta={t("admin.users")} />
              </View>

              {/* el desglossament sencer és a Mètriques; aquí només la forma */}
              {perMode.length > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
                  {perMode.map(([mode, total]) => (
                    <Text
                      key={mode}
                      style={{ fontFamily: FONTS.sans, fontSize: 12, color: COLORS.textSecondary }}
                      maxFontSizeMultiplier={1.4}
                    >
                      <Text style={{ fontWeight: "700", color: COLORS.text }}>{total}</Text>
                      {" "}
                      {etiquetaMode(t, mode)}
                    </Text>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* ---------- on anar a treballar ----------
            Els accessos no depenen de les mètriques: es dibuixen encara que la
            petició falli o vagi lenta, cosa que abans deixava el panell
            inservible mentre durava la càrrega. */}
        <Grup titol={t("admin.sectionContent")}>
          <Acces
            primera
            titol={t("admin.autores")}
            descripcio={t("admin.autoresDesc")}
            onPress={() => router.push("/(admin)/autores")}
          />
          <Acces
            titol={t("admin.textos")}
            descripcio={t("admin.textosDesc")}
            onPress={() => router.push("/(admin)/textos")}
          />
          <Acces
            titol={t("admin.parades")}
            descripcio={t("admin.paradesDesc")}
            onPress={() => router.push("/(admin)/parades")}
          />
        </Grup>

        <Grup titol={t("admin.sectionCommunity")}>
          <Acces
            primera
            titol={t("admin.comentaris")}
            descripcio={t("admin.comentarisDesc")}
            onPress={() => router.push("/(admin)/comentaris")}
          />
          {/* Només administració: GET /usuaris exigeix rol ADMINISTRADOR */}
          {user?.rol === "ADMINISTRADOR" && (
            <Acces
              titol={t("admin.usuaris")}
              descripcio={t("admin.usuarisDesc")}
              onPress={() => router.push("/(admin)/usuaris")}
            />
          )}
        </Grup>

        <Grup titol={t("admin.sectionData")}>
          <Acces
            primera
            titol={t("admin.metriques")}
            descripcio={t("admin.metriquesDesc")}
            onPress={() => router.push("/(admin)/metriques")}
          />
        </Grup>
      </ScrollView>
    </View>
  );
}

function suma(dades: Record<string, number>): number {
  return Object.values(dades).reduce((a, b) => a + b, 0);
}


function Xifra({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <View accessibilityRole="text" accessibilityLabel={`${valor} ${etiqueta}`} style={{ flex: 1 }}>
      <Text
        style={{ fontFamily: FONTS.serif, fontSize: 34, color: COLORS.accent, lineHeight: 40 }}
        maxFontSizeMultiplier={1.3}
      >
        {valor}
      </Text>
      <Text
        style={{ fontFamily: FONTS.sans, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}
        maxFontSizeMultiplier={1.4}
      >
        {etiqueta}
      </Text>
    </View>
  );
}

function Grup({ titol, children }: { titol: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: 18, marginTop: 22 }}>
      <Rotul text={titol} />
      <View
        style={{
          marginTop: 8,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );
}

function Acces({
  titol,
  descripcio,
  onPress,
  primera = false,
}: {
  titol: string;
  descripcio: string;
  onPress: () => void;
  primera?: boolean;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={titol}
      accessibilityHint={descripcio}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
        minHeight: 56,
        borderTopWidth: primera ? 0 : 1,
        borderTopColor: COLORS.border,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontFamily: FONTS.sans, fontSize: 13, fontWeight: "600", color: COLORS.text }}
          maxFontSizeMultiplier={1.5}
        >
          {titol}
        </Text>
        <Text
          style={{
            fontFamily: FONTS.sans,
            fontSize: 12,
            color: COLORS.textSecondary,
            marginTop: 2,
            lineHeight: 16,
          }}
          maxFontSizeMultiplier={1.4}
        >
          {descripcio}
        </Text>
      </View>
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={{ fontFamily: FONTS.sans, fontSize: 15, color: COLORS.controlBorder }}
        maxFontSizeMultiplier={1.3}
      >
        →
      </Text>
    </TouchableOpacity>
  );
}
