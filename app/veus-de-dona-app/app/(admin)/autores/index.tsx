import { useState, useCallback } from "react";
import { View, ScrollView } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { COLORS } from "../../../constants";
import { useLanguage } from "../../../contexts/LanguageContext";
import { Capcalera } from "../../../components/Capcalera";
import { EstatLlista, FilaLlista } from "../../../components/admin/LlistaAdmin";
import { getAutores } from "../../../services/autores";
import { Autora } from "../../../types";

export default function AdminAutores() {
  const router = useRouter();
  const { t } = useLanguage();
  const [autores, setAutores] = useState<Autora[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getAutores()
        .then((dades) => {
          setAutores(dades);
          setError(false);
        })
        .catch(() => {
          setAutores([]);
          setError(true);
        })
        .finally(() => setLoading(false));
    }, [])
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Capcalera tornarA="panell" titol={t("admin.autores")} />

        <EstatLlista
          loading={loading}
          error={error}
          buit={autores.length === 0}
          missatgeBuit={t("admin.autoresEmpty")}
        />

        {!loading && !error && autores.length > 0 && (
          <View style={{ paddingHorizontal: 18, paddingTop: 18, gap: 8 }}>
            {autores.map((a) => (
              <FilaLlista
                key={a.id}
                titol={`${a.nom} ${a.cognom}`}
                subtitol={a.anys_vida}
                accessibilityLabel={`${t("admin.editAutora")}: ${a.nom} ${a.cognom}`}
                onPress={() => router.push(`/(admin)/autores/${a.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
