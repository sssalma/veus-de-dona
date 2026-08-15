import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS } from "../../constants";
import { getTotsElsComentaris, eliminarComentari, respondreComentari } from "../../services/comentaris";
import { Comentari } from "../../types";

export default function ModeracioComentaris() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [comentaris, setComentaris] = useState<Comentari[]>([]);
  const [loading, setLoading] = useState(true);
  const [respostes, setRespostes] = useState<Record<string, string>>({});
  const [enviant, setEnviant] = useState<string | null>(null);

  const carregar = useCallback(() => {
    setLoading(true);
    getTotsElsComentaris()
      .then(setComentaris)
      .catch(() => setComentaris([]))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(carregar);

  const handleEliminar = (id: string) => {
    Alert.alert("Eliminar comentari", "Segur que vols eliminar aquest comentari?", [
      { text: "Cancel·lar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await eliminarComentari(id);
            setComentaris((prev) => prev.filter((c) => c.id !== id));
          } catch {
            Alert.alert("Error", "No s'ha pogut eliminar el comentari");
          }
        },
      },
    ]);
  };

  const handleRespondre = async (id: string) => {
    const resposta = (respostes[id] ?? "").trim();
    if (!resposta) return;
    setEnviant(id);
    try {
      const actualitzat = await respondreComentari(id, resposta);
      setComentaris((prev) => prev.map((c) => (c.id === id ? actualitzat : c)));
      setRespostes((prev) => ({ ...prev, [id]: "" }));
    } catch {
      Alert.alert("Error", "No s'ha pogut enviar la resposta");
    } finally {
      setEnviant(null);
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
          Moderació de comentaris
        </Text>
      </View>

      {loading ? (
        <View accessibilityLabel="Carregant comentaris" style={{ padding: 24, alignItems: "center" }}>
          <ActivityIndicator size="small" color={COLORS.darkBg} />
        </View>
      ) : comentaris.length === 0 ? (
        <Text
          accessibilityRole="text"
          style={{ fontFamily: FONTS.sans, fontSize: 11, color: COLORS.textSecondary, padding: 14, fontStyle: "italic" }}
          maxFontSizeMultiplier={1.5}
        >
          No hi ha comentaris.
        </Text>
      ) : (
        <View style={{ padding: 14, gap: 10 }}>
          {comentaris.map((c) => (
            <View
              key={c.id}
              style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 8,
                padding: 10,
                gap: 6,
              }}
            >
              <Text style={{ fontFamily: FONTS.sans, fontSize: 9, color: COLORS.textSecondary }} maxFontSizeMultiplier={1.3}>
                {new Date(c.data_creacio).toLocaleString("ca-ES")}
              </Text>
              <Text
                accessibilityRole="text"
                style={{ fontFamily: FONTS.sans, fontSize: 12, color: COLORS.text }}
                maxFontSizeMultiplier={1.5}
              >
                {c.contingut}
              </Text>

              {c.resposta_editor ? (
                <View
                  accessibilityRole="text"
                  accessibilityLabel={`Resposta de l'editor: ${c.resposta_editor}`}
                  style={{
                    backgroundColor: COLORS.lightBg,
                    borderRadius: 6,
                    padding: 8,
                    borderLeftWidth: 2,
                    borderLeftColor: COLORS.accent,
                  }}
                >
                  <Text style={{ fontFamily: FONTS.sans, fontSize: 9, color: COLORS.accent, marginBottom: 2 }} maxFontSizeMultiplier={1.3}>
                    Resposta de l'editor
                  </Text>
                  <Text style={{ fontFamily: FONTS.sans, fontSize: 11, color: COLORS.text }} maxFontSizeMultiplier={1.5}>
                    {c.resposta_editor}
                  </Text>
                </View>
              ) : (
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <TextInput
                    accessibilityRole="text"
                    accessibilityLabel={`Respondre al comentari: ${c.contingut}`}
                    placeholder="Respondre..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={respostes[c.id] ?? ""}
                    onChangeText={(text) => setRespostes((prev) => ({ ...prev, [c.id]: text }))}
                    maxFontSizeMultiplier={1.5}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 6,
                      fontFamily: FONTS.sans,
                      fontSize: 11,
                      color: COLORS.text,
                      minHeight: 44,
                    }}
                  />
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Enviar resposta"
                    accessibilityState={{ disabled: enviant === c.id || !(respostes[c.id] ?? "").trim() }}
                    onPress={() => handleRespondre(c.id)}
                    disabled={enviant === c.id || !(respostes[c.id] ?? "").trim()}
                    style={{
                      backgroundColor: COLORS.darkBg,
                      borderRadius: 6,
                      paddingHorizontal: 12,
                      justifyContent: "center",
                      opacity: enviant === c.id || !(respostes[c.id] ?? "").trim() ? 0.5 : 1,
                      minHeight: 44,
                      minWidth: 44,
                    }}
                  >
                    <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.bg }} maxFontSizeMultiplier={1.3}>
                      Enviar
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Eliminar comentari"
                onPress={() => handleEliminar(c.id)}
                style={{ alignSelf: "flex-start", minHeight: 44, justifyContent: "center" }}
              >
                <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.love }} maxFontSizeMultiplier={1.4}>
                  Eliminar
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
