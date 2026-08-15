import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS } from "../../constants";
import { getMetriquesGlobal } from "../../services/metriques";
import { MetriquesGlobal } from "../../types";

export default function AdminDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [metriques, setMetriques] = useState<MetriquesGlobal | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getMetriquesGlobal()
        .then(setMetriques)
        .catch(() => setMetriques(null))
        .finally(() => setLoading(false));
    }, [])
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View
        style={{
          paddingHorizontal: 14,
          paddingTop: insets.top + 6,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <TouchableOpacity onPress={() => router.replace("/(tabs)/perfil")} style={{ marginBottom: 6 }}>
          <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary }}>
            ← Perfil
          </Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: FONTS.serif, fontSize: 16, fontWeight: "600", color: COLORS.text }}>
          Panell d'administració
        </Text>
      </View>

      {loading ? (
        <View style={{ padding: 24, alignItems: "center" }}>
          <ActivityIndicator size="small" color={COLORS.darkBg} />
        </View>
      ) : (
        <View style={{ padding: 14, gap: 16 }}>
          <Section title="Visites per mode">
            {metriques &&
              Object.entries(metriques.visites_per_mode).map(([mode, count]) => (
                <Row key={mode} label={mode} value={String(count)} />
              ))}
          </Section>

          <Section title="Usuaris per rol">
            {metriques &&
              Object.entries(metriques.usuaris_per_rol).map(([rol, count]) => (
                <Row key={rol} label={rol} value={String(count)} />
              ))}
          </Section>

          <Section title="Textos més agradats">
            {metriques?.textos_mes_agradats.length ? (
              metriques.textos_mes_agradats.map((t) => (
                <Row key={t.text_id} label={t.titol} value={String(t.likes)} />
              ))
            ) : (
              <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary }}>
                Encara no hi ha likes
              </Text>
            )}
          </Section>

          <TouchableOpacity
            onPress={() => router.push("/(admin)/comentaris")}
            style={{
              borderWidth: 1,
              borderColor: COLORS.text,
              borderRadius: 8,
              paddingVertical: 12,
              alignItems: "center",
              minHeight: 44,
              justifyContent: "center",
            }}
          >
            <Text style={{ fontFamily: FONTS.sans, fontSize: 11, fontWeight: "500", color: COLORS.text }}>
              Moderar comentaris
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10 }}>
      <Text
        style={{
          fontFamily: FONTS.sans,
          fontSize: 10,
          fontWeight: "600",
          color: COLORS.textSecondary,
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: 0.4,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 5,
      }}
    >
      <Text style={{ fontFamily: FONTS.sans, fontSize: 11, color: COLORS.text, flex: 1 }} numberOfLines={1}>
        {label}
      </Text>
      <Text style={{ fontFamily: FONTS.sans, fontSize: 11, fontWeight: "600", color: COLORS.accent }}>
        {value}
      </Text>
    </View>
  );
}
