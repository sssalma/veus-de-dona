import { useState, useCallback, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Switch, TextInput } from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect, Redirect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS } from "../../../constants";
import { useAuth } from "../../../contexts/AuthContext";
import { getUsuaris, setUsuariActiu, setUsuariRol } from "../../../services/usuaris";
import { Usuari } from "../../../types";

const ROLS = ["VISITANT", "EDITOR", "ADMINISTRADOR"];
const FILTRES_ROL = ["TOTS", ...ROLS];

export default function AdminUsuaris() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { resaltar } = useLocalSearchParams<{ resaltar?: string }>();
  const [usuaris, setUsuaris] = useState<Usuari[]>([]);
  const [loading, setLoading] = useState(true);
  const [cerca, setCerca] = useState("");
  const [filtreRol, setFiltreRol] = useState("TOTS");

  const carregar = useCallback(() => {
    setLoading(true);
    getUsuaris()
      .then(setUsuaris)
      .catch(() => setUsuaris([]))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(carregar);

  const usuarisFiltrats = useMemo(() => {
    const q = cerca.trim().toLowerCase();
    return usuaris.filter((u) => {
      if (filtreRol !== "TOTS" && u.rol !== filtreRol) return false;
      if (!q) return true;
      return (
        u.nom.toLowerCase().includes(q) ||
        u.cognom.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [usuaris, cerca, filtreRol]);

  if (user && user.rol !== "ADMINISTRADOR") {
    return <Redirect href="/(admin)" />;
  }

  const handleToggleActiu = async (u: Usuari, valor: boolean) => {
    setUsuaris((prev) => prev.map((x) => (x.id === u.id ? { ...x, actiu: valor } : x)));
    try {
      await setUsuariActiu(u.id, valor);
    } catch {
      setUsuaris((prev) => prev.map((x) => (x.id === u.id ? { ...x, actiu: !valor } : x)));
    }
  };

  const handleCanviarRol = async (u: Usuari, rol: string) => {
    if (rol === u.rol) return;
    const anterior = u.rol;
    setUsuaris((prev) => prev.map((x) => (x.id === u.id ? { ...x, rol } : x)));
    try {
      await setUsuariRol(u.id, rol);
    } catch {
      setUsuaris((prev) => prev.map((x) => (x.id === u.id ? { ...x, rol: anterior } : x)));
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View
        accessibilityRole="header"
        style={{
          paddingHorizontal: 14,
          paddingTop: insets.top + 6,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Tornar al panell"
          onPress={() => router.back()}
          style={{ marginBottom: 6, minHeight: 44, minWidth: 44, justifyContent: "center" }}
        >
          <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary }} maxFontSizeMultiplier={1.4}>
            ← Panell
          </Text>
        </TouchableOpacity>
        <Text
          accessibilityRole="header"
          style={{ fontFamily: FONTS.serif, fontSize: 16, fontWeight: "600", color: COLORS.text }}
          maxFontSizeMultiplier={1.5}
        >
          Usuaris
        </Text>
      </View>

      <View style={{ paddingHorizontal: 14, paddingTop: 12, gap: 8 }}>
        <TextInput
          accessibilityRole="text"
          accessibilityLabel="Cercar usuaris per nom, cognom o email"
          placeholder="Cercar per nom, cognom o email..."
          placeholderTextColor={COLORS.textSecondary}
          value={cerca}
          onChangeText={setCerca}
          autoCapitalize="none"
          maxFontSizeMultiplier={1.5}
          style={{
            borderWidth: 1,
            borderColor: COLORS.controlBorder,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontFamily: FONTS.sans,
            fontSize: 12,
            color: COLORS.text,
            backgroundColor: COLORS.lightBg,
            minHeight: 44,
          }}
        />
        <View accessibilityRole="radiogroup" accessibilityLabel="Filtrar per rol" style={{ flexDirection: "row", gap: 6 }}>
          {FILTRES_ROL.map((rol) => {
            const selected = rol === filtreRol;
            return (
              <TouchableOpacity
                key={rol}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Filtre: ${rol}`}
                onPress={() => setFiltreRol(rol)}
                style={{
                  borderWidth: 1,
                  borderColor: selected ? COLORS.darkBg : COLORS.controlBorder,
                  backgroundColor: selected ? COLORS.darkBg : "transparent",
                  borderRadius: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  minHeight: 36,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 9,
                    color: selected ? COLORS.bg : COLORS.textSecondary,
                  }}
                  maxFontSizeMultiplier={1.3}
                >
                  {rol}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View accessibilityLabel="Carregant usuaris" style={{ padding: 24, alignItems: "center" }}>
          <ActivityIndicator size="small" color={COLORS.darkBg} />
        </View>
      ) : usuarisFiltrats.length === 0 ? (
        <Text
          accessibilityRole="text"
          style={{ fontFamily: FONTS.sans, fontSize: 11, color: COLORS.textSecondary, padding: 14, fontStyle: "italic" }}
          maxFontSizeMultiplier={1.5}
        >
          Cap usuari coincideix amb la cerca.
        </Text>
      ) : (
        <View style={{ padding: 14, gap: 10 }}>
          {usuarisFiltrats.map((u) => {
            const resaltat = u.id === resaltar;
            return (
              <View
                key={u.id}
                style={{
                  borderWidth: resaltat ? 2 : 1,
                  borderColor: resaltat ? COLORS.accent : COLORS.controlBorder,
                  backgroundColor: resaltat ? COLORS.lightBg : "transparent",
                  borderRadius: 8,
                  padding: 12,
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONTS.sans, fontSize: 12, fontWeight: "600", color: COLORS.text }} maxFontSizeMultiplier={1.5}>
                      {u.nom} {u.cognom}
                    </Text>
                    <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary }} maxFontSizeMultiplier={1.4}>
                      {u.email}
                    </Text>
                  </View>
                  <Switch
                    accessibilityLabel={`${u.nom} ${u.cognom}: compte ${u.actiu ? "activat" : "desactivat"}, prem per ${u.actiu ? "desactivar" : "activar"}`}
                    accessibilityRole="switch"
                    value={u.actiu}
                    onValueChange={(v) => handleToggleActiu(u, v)}
                  />
                </View>

                <View
                  accessibilityRole="radiogroup"
                  accessibilityLabel={`Rol de ${u.nom} ${u.cognom}`}
                  style={{ flexDirection: "row", gap: 6 }}
                >
                  {ROLS.map((rol) => {
                    const selected = rol === u.rol;
                    return (
                      <TouchableOpacity
                        key={rol}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`Rol ${rol}`}
                        hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                        onPress={() => handleCanviarRol(u, rol)}
                        style={{
                          borderWidth: 1,
                          borderColor: selected ? COLORS.darkBg : COLORS.controlBorder,
                          backgroundColor: selected ? COLORS.darkBg : "transparent",
                          borderRadius: 6,
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: FONTS.sans,
                            fontSize: 9,
                            color: selected ? COLORS.bg : COLORS.textSecondary,
                          }}
                          maxFontSizeMultiplier={1.3}
                        >
                          {rol}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
