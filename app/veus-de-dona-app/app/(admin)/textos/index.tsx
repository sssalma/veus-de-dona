import { useState, useCallback, useMemo } from "react";
import { View, Text, ScrollView } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { COLORS } from "../../../constants";
import { useLanguage } from "../../../contexts/LanguageContext";
import { Rotul } from "../../../components/Rotul";
import { Capcalera } from "../../../components/Capcalera";
import { EstatLlista, FilaLlista } from "../../../components/admin/LlistaAdmin";
import { getAllTextos } from "../../../services/textos";
import { getTotesLesParades } from "../../../services/parades";
import { TextDto, Parada } from "../../../types";

export default function AdminTextos() {
  const router = useRouter();
  const { t } = useLanguage();
  const [textos, setTextos] = useState<TextDto[]>([]);
  const [parades, setParades] = useState<Parada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      // El servidor ja retorna els textos ordenats per ordre de ruta, però
      // `TextResponse` només porta el `parada_id`: per posar-hi el nom de la
      // parada al capdamunt de cada grup cal creuar-ho amb les parades.
      Promise.all([getAllTextos(), getTotesLesParades()])
        .then(([t, p]) => {
          setTextos(t);
          setParades(p);
          setError(false);
        })
        .catch(() => {
          setTextos([]);
          setParades([]);
          setError(true);
        })
        .finally(() => setLoading(false));
    }, [])
  );

  const grups = useMemo(() => {
    const perId = new Map(parades.map((p) => [p.id, p]));

    // Es respecta l'ordre en què arriben els textos -que ja és el de la ruta-
    // en comptes de reordenar aquí: així la pantalla no pot discrepar del
    // criteri del servidor si algun dia canvia.
    const ordre: string[] = [];
    const perParada = new Map<string, TextDto[]>();

    for (const text of textos) {
      const clau = perId.has(text.parada_id) ? text.parada_id : "";
      if (!perParada.has(clau)) {
        perParada.set(clau, []);
        ordre.push(clau);
      }
      perParada.get(clau)!.push(text);
    }

    return ordre.map((clau) => {
      const parada = perId.get(clau);
      return {
        clau,
        titol: parada ? `${parada.ordre}. ${parada.nom_espai}` : t("admin.noStop"),
        textos: perParada.get(clau)!,
      };
    });
  }, [textos, parades, t]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Capcalera tornarA="panell" titol={t("admin.textos")} />

        <EstatLlista
          loading={loading}
          error={error}
          buit={textos.length === 0}
          missatgeBuit={t("admin.textosEmpty")}
        />

        {!loading && !error && grups.length > 0 && (
          <View style={{ paddingHorizontal: 18, paddingTop: 18, gap: 20 }}>
            {grups.map((grup) => (
              <View key={grup.clau || "sense-parada"} style={{ gap: 8 }}>
                <Rotul text={grup.titol} />

                {grup.textos.map((text) => {
                  const autora = text.autora
                    ? `${text.autora.nom} ${text.autora.cognom}`
                    : t("admin.noAuthor");
                  return (
                    <FilaLlista
                      key={text.id}
                      titol={text.titol}
                      subtitol={autora}
                      accessibilityLabel={`${t("admin.editText")}: ${text.titol}, ${autora}, ${grup.titol}`}
                      onPress={() => router.push(`/(admin)/textos/${text.id}`)}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
