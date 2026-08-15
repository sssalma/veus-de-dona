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
        style={{
          paddingHorizontal: 14,
          paddingTop: insets.top + 6,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 6 }}>
          <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary }}>
            ← Panell
          </Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: FONTS.serif, fontSize: 16, fontWeight: "600", color: COLORS.text }}>
          Moderació de comentaris
        </Text>
      </View>

      {loading ? (
        <View style={{ padding: 24, alignItems: "center" }}>
          <ActivityIndicator size="small" color={COLORS.darkBg} />
        </View>
      ) : comentaris.length === 0 ? (
        <Text
          style={{ fontFamily: FONTS.sans, fontSize: 11, color: COLORS.textSecondary, padding: 14, fontStyle: "italic" }}
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
              <Text style={{ fontFamily: FONTS.sans, fontSize: 9, color: COLORS.textSecondary }}>
                {new Date(c.data_creacio).toLocaleString("ca-ES")}
              </Text>
              <Text style={{ fontFamily: FONTS.sans, fontSize: 12, color: COLORS.text }}>
                {c.contingut}
              </Text>

              {c.resposta_editor ? (
                <View
                  style={{
                    backgroundColor: COLORS.lightBg,
                    borderRadius: 6,
                    padding: 8,
                    borderLeftWidth: 2,
                    borderLeftColor: COLORS.accent,
                  }}
                >
                  <Text style={{ fontFamily: FONTS.sans, fontSize: 9, color: COLORS.accent, marginBottom: 2 }}>
                    Resposta de l'editor
                  </Text>
                  <Text style={{ fontFamily: FONTS.sans, fontSize: 11, color: COLORS.text }}>
                    {c.resposta_editor}
                  </Text>
                </View>
              ) : (
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <TextInput
                    placeholder="Respondre..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={respostes[c.id] ?? ""}
                    onChangeText={(text) => setRespostes((prev) => ({ ...prev, [c.id]: text }))}
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
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => handleRespondre(c.id)}
                    disabled={enviant === c.id || !(respostes[c.id] ?? "").trim()}
                    style={{
                      backgroundColor: COLORS.darkBg,
                      borderRadius: 6,
                      paddingHorizontal: 12,
                      justifyContent: "center",
                      opacity: enviant === c.id || !(respostes[c.id] ?? "").trim() ? 0.5 : 1,
                    }}
                  >
                    <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.bg }}>
                      Enviar
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity onPress={() => handleEliminar(c.id)} style={{ alignSelf: "flex-start" }}>
                <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.love }}>
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
