import { useState, useCallback } from "react";
import { View, ScrollView } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { COLORS } from "../../../constants";
import { useLanguage } from "../../../contexts/LanguageContext";
import { Capcalera } from "../../../components/Capcalera";
import { EstatLlista, FilaLlista } from "../../../components/admin/LlistaAdmin";
import { getTotesLesParades } from "../../../services/parades";
import { Parada } from "../../../types";

export default function AdminParades() {
  const router = useRouter();
  const { t } = useLanguage();
  const [parades, setParades] = useState<Parada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getTotesLesParades()
        .then((dades) => {
          setParades(dades);
          setError(false);
        })
        .catch(() => {
          setParades([]);
          setError(true);
        })
        .finally(() => setLoading(false));
    }, [])
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Capcalera tornarA="panell" titol={t("admin.parades")} />

        <EstatLlista
          loading={loading}
          error={error}
          buit={parades.length === 0}
          missatgeBuit={t("admin.paradesEmpty")}
        />

        {!loading && !error && parades.length > 0 && (
          <View style={{ paddingHorizontal: 18, paddingTop: 18, gap: 8 }}>
            {parades.map((p) => (
              <FilaLlista
                key={p.id}
                titol={`${p.ordre}. ${p.nom_espai}`}
                distintiu={p.activa ? null : t("admin.inactive")}
                accessibilityLabel={
                  `${t("admin.editParada")} ${p.ordre}: ${p.nom_espai}` +
                  (p.activa ? "" : `, ${t("admin.inactive")}`)
                }
                onPress={() => router.push(`/(admin)/parades/${p.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
