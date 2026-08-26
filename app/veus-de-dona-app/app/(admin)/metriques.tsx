import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { COLORS, FONTS } from "../../constants";
import { Rotul } from "../../components/Rotul";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  etiquetaMode,
  etiquetaRol,
  ordenaPer,
  ORDRE_MODES,
  ORDRE_ROLS,
} from "../../i18n/etiquetes";
import { Capcalera } from "../../components/Capcalera";
import { getMetriquesGlobal, getMetriquesParades } from "../../services/metriques";
import { MetriquesGlobal, MetriquesParada } from "../../types";

/**
 * Pantalla de mètriques.
 *
 * Recull tot el que es pot saber de l'ús de la ruta: primer les xifres
 * globals i després el desglossament parada per parada.
 *
 * Els noms dels modes i dels rols es tradueixen; no s'ensenya mai el valor de
 * l'enum tal com arriba del servidor.
 */
export default function Metriques() {
  const router = useRouter();
  const { t } = useLanguage();
  const [global, setGlobal] = useState<MetriquesGlobal | null>(null);
  const [parades, setParades] = useState<MetriquesParada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([getMetriquesGlobal(), getMetriquesParades()])
        .then(([g, p]) => {
          setGlobal(g);
          setParades(p);
          setError(false);
        })
        .catch(() => {
          setGlobal(null);
          setParades([]);
          setError(true);
        })
        .finally(() => setLoading(false));
    }, [])
  );

  const visitesDeParada = (p: MetriquesParada) =>
    Object.values(p.visites_per_mode).reduce((a, b) => a + b, 0);

  const totalVisites = parades.reduce((acc, p) => acc + visitesDeParada(p), 0);
  // Referència per a l'amplada de les barres. El mínim d'1 evita dividir per
  // zero quan encara no hi ha cap visita registrada.
  const maxVisites = Math.max(1, ...parades.map(visitesDeParada));

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>

        <Capcalera tornarA="panell" titol={t("admin.metriques")} />

        {loading ? (
          <View
            accessibilityLabel={t("admin.loading")}
            style={{ padding: 28, alignItems: "center" }}
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
              padding: 18,
            }}
            maxFontSizeMultiplier={1.5}
          >
            {t("admin.dataUnavailable")}
          </Text>
        ) : (
          <>
            {/* ---------- xifres globals ---------- */}
            {global && (
              <>
                <Bloc titol={t("admin.visitsByMode")}>
                  {ordenaPer(global.visites_per_mode, ORDRE_MODES).map(([mode, total]) => (
                    <Fila key={mode} etiqueta={etiquetaMode(t, mode)} valor={total} />
                  ))}
                </Bloc>

                <Bloc titol={t("admin.usersByRole")}>
                  {ordenaPer(global.usuaris_per_rol, ORDRE_ROLS).map(([rol, total]) => (
                    <Fila key={rol} etiqueta={etiquetaRol(t, rol)} valor={total} />
                  ))}
                </Bloc>

                <Bloc titol={t("admin.mostLikedTexts")}>
                  {global.textos_mes_agradats.length > 0 ? (
                    global.textos_mes_agradats.map((text) => (
                      <Fila key={text.text_id} etiqueta={text.titol} valor={text.likes} />
                    ))
                  ) : (
                    <Text
                      style={{
                        fontFamily: FONTS.sans,
                        fontSize: 12,
                        color: COLORS.textSecondary,
                        fontStyle: "italic",
                      }}
                      maxFontSizeMultiplier={1.5}
                    >
                      {t("admin.noLikes")}
                    </Text>
                  )}
                </Bloc>
              </>
            )}

            {/* ---------- desglossament per parada ---------- */}
            <View style={{ paddingHorizontal: 18, marginTop: 22 }}>
              <Rotul text={t("admin.perStop")} />

              {parades.length === 0 ? (
                <Text
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 12,
                    color: COLORS.textSecondary,
                    fontStyle: "italic",
                    marginTop: 8,
                  }}
                  maxFontSizeMultiplier={1.5}
                >
                  {t("admin.noUsageData")}
                </Text>
              ) : (
                <>
                  <Text
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: 12,
                      color: COLORS.textSecondary,
                      marginTop: 6,
                    }}
                    maxFontSizeMultiplier={1.4}
                  >
                    {totalVisites} {t("admin.visitsIn")} {parades.length} {t("admin.stopsWord")}
                  </Text>

                  <View style={{ gap: 10, marginTop: 12 }}>
                    {parades.map((p) => {
                      const visites = visitesDeParada(p);
                      // La targeta es llegeix com un sol element: agrupar-ho
                      // evita que un lector de pantalla hagi de recórrer les
                      // xifres soltes una per una.
                      const resum =
                        `${p.ordre}. ${p.nom_espai}: ` +
                        `${visites} ${t("admin.visits")}, ` +
                        `${p.likes} ${t("admin.likes")}, ${p.comentaris} ${t("admin.comments")}`;
                      return (
                        // Mirar una xifra fluixa i voler obrir la parada és el
                        // moviment natural des d'aquí. Porta a la pantalla
                        // d'edició -no a la fitxa pública- perquè és on es pot
                        // fer alguna cosa amb el que acabes de veure, i perquè
                        // editar parades ja el poden fer els dos rols que
                        // arriben a aquesta pantalla.
                        <TouchableOpacity
                          key={p.parada_id}
                          accessibilityRole="button"
                          accessibilityLabel={resum}
                          accessibilityHint={t("admin.editParada")}
                          onPress={() => router.push(`/(admin)/parades/${p.parada_id}`)}
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
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <Text
                              style={{
                                flex: 1,
                                fontFamily: FONTS.sans,
                                fontSize: 13,
                                fontWeight: "600",
                                color: COLORS.text,
                              }}
                              maxFontSizeMultiplier={1.5}
                            >
                              {p.ordre}. {p.nom_espai}
                            </Text>
                            <Text
                              accessibilityElementsHidden
                              importantForAccessibility="no"
                              style={{
                                fontFamily: FONTS.sans,
                                fontSize: 15,
                                color: COLORS.controlBorder,
                              }}
                              maxFontSizeMultiplier={1.3}
                            >
                              →
                            </Text>
                          </View>

                          {/* barra proporcional a la parada més visitada */}
                          <View
                            accessibilityElementsHidden
                            importantForAccessibility="no"
                            style={{
                              height: 5,
                              backgroundColor: COLORS.border,
                              borderRadius: 3,
                              overflow: "hidden",
                            }}
                          >
                            <View
                              style={{
                                height: "100%",
                                width: `${(visites / maxVisites) * 100}%`,
                                backgroundColor: COLORS.accent,
                                borderRadius: 3,
                              }}
                            />
                          </View>

                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
                            <Metrica etiqueta={t("admin.visits")} valor={visites} />
                            <Metrica etiqueta={t("admin.likes")} valor={p.likes} />
                            <Metrica etiqueta={t("admin.comments")} valor={p.comentaris} />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}


function Bloc({ titol, children }: { titol: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: 18, marginTop: 22 }}>
      <Rotul text={titol} />
      <View
        style={{
          marginTop: 8,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 6,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`${etiqueta}: ${valor}`}
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        paddingVertical: 7,
      }}
    >
      <Text
        style={{ fontFamily: FONTS.sans, fontSize: 12, color: COLORS.text, flex: 1 }}
        numberOfLines={2}
        maxFontSizeMultiplier={1.4}
      >
        {etiqueta}
      </Text>
      <Text
        style={{ fontFamily: FONTS.sans, fontSize: 13, fontWeight: "700", color: COLORS.accent }}
        maxFontSizeMultiplier={1.4}
      >
        {valor}
      </Text>
    </View>
  );
}

function Metrica({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}
    >
      <Text
        style={{
          fontFamily: FONTS.sans,
          fontSize: 14,
          fontWeight: "700",
          color: COLORS.accent,
        }}
        maxFontSizeMultiplier={1.4}
      >
        {valor}
      </Text>
      <Text
        style={{ fontFamily: FONTS.sans, fontSize: 12, color: COLORS.textSecondary }}
        maxFontSizeMultiplier={1.3}
      >
        {etiqueta}
      </Text>
    </View>
  );
}
