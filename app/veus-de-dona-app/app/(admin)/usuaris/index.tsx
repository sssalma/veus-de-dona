import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Switch } from "react-native";
import { useRouter, useFocusEffect, Redirect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS } from "../../../constants";
import { useAuth } from "../../../contexts/AuthContext";
import { getUsuaris, setUsuariActiu, setUsuariRol } from "../../../services/usuaris";
import { Usuari } from "../../../types";

const ROLS = ["VISITANT", "EDITOR", "ADMINISTRADOR"];

export default function AdminUsuaris() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [usuaris, setUsuaris] = useState<Usuari[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(() => {
    setLoading(true);
    getUsuaris()
      .then(setUsuaris)
      .catch(() => setUsuaris([]))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(carregar);

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

      {loading ? (
        <View accessibilityLabel="Carregant usuaris" style={{ padding: 24, alignItems: "center" }}>
          <ActivityIndicator size="small" color={COLORS.darkBg} />
        </View>
      ) : (
        <View style={{ padding: 14, gap: 10 }}>
          {usuaris.map((u) => (
            <View
              key={u.id}
              style={{
                borderWidth: 1,
                borderColor: COLORS.border,
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
                        borderColor: selected ? COLORS.darkBg : COLORS.border,
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
          ))}
        </View>
      )}
    </ScrollView>
  );
}
