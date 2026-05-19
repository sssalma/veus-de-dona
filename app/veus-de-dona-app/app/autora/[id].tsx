import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { COLORS, FONTS } from "../../constants";
import { getAutora } from "../../services/autores";
import { getTextosByAutora } from "../../services/textos";
import { getParades } from "../../services/parades";
import { Autora, Parada, TextDto } from "../../types";

export default function AutoraScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [autora, setAutora] = useState<Autora | null>(null);
  const [textos, setTextos] = useState<TextDto[]>([]);
  const [totesParades, setTotesParades] = useState<Parada[]>([]);

  useEffect(() => {
    const aid = id as string;
    getAutora(aid).then(setAutora).catch(() => setAutora(null));
    getTextosByAutora(aid).then(setTextos).catch(() => setTextos([]));
    getParades().then(setTotesParades).catch(() => setTotesParades([]));
  }, [id]);

  if (!autora) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg }}>
        <Text style={{ fontFamily: FONTS.sans, color: COLORS.textSecondary }}>
          Autora no trobada
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary }}>
            ← Parada {id}
          </Text>
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: FONTS.serif,
            fontSize: 13,
            fontWeight: "600",
            color: COLORS.text,
          }}
        >
          Fitxa autora
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View
        style={{
          padding: 14,
          flexDirection: "row",
          gap: 12,
          alignItems: "flex-start",
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: COLORS.darkBg,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.serif,
              fontSize: 16,
              color: COLORS.bg,
            }}
          >
            {autora.nom[0]}
            {autora.cognom[0]}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: FONTS.serif,
              fontSize: 14,
              fontWeight: "600",
              color: COLORS.text,
            }}
          >
            {autora.nom} {autora.cognom}
          </Text>
          {autora.anys_vida && (
            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: 9,
                color: COLORS.textSecondary,
                marginTop: 2,
              }}
            >
              {autora.anys_vida}
            </Text>
          )}
          <View style={{ flexDirection: "row", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
            <View
              style={{
                paddingHorizontal: 7,
                paddingVertical: 2,
                backgroundColor: "#f0ece4",
                borderRadius: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 8,
                  color: "#5a5040",
                }}
              >
                Poesia
              </Text>
            </View>
            <View
              style={{
                paddingHorizontal: 7,
                paddingVertical: 2,
                backgroundColor: "#f0ece4",
                borderRadius: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 8,
                  color: "#5a5040",
                }}
              >
                Narrativa
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <Text
          style={{
            fontFamily: FONTS.sans,
            fontSize: 10,
            color: COLORS.textSecondary,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            marginBottom: 5,
          }}
        >
          Biografia
        </Text>
        <Text
          style={{
            fontFamily: FONTS.sans,
            fontSize: 10,
            color: "#3d3d3a",
            lineHeight: 17,
          }}
        >
          {autora.bio}
        </Text>
      </View>

      <View style={{ padding: 14 }}>
        <Text
          style={{
            fontFamily: FONTS.sans,
            fontSize: 10,
            color: COLORS.textSecondary,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Textos a la ruta
        </Text>
        {textos.map((texto) => {
          const parada = totesParades.find((p) => p.id === texto.parada_id);
          return (
            <TouchableOpacity
              key={texto.id}
              onPress={() => router.push(`/parada/${texto.parada_id}`)}
              style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 6,
                padding: 10,
                marginBottom: 6,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 11,
                  fontWeight: "500",
                  color: COLORS.text,
                }}
              >
                {texto.titol}
              </Text>
              <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary, marginTop: 2 }}>
                {texto.obra_origen} · Parada {parada?.ordre ?? "?"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
