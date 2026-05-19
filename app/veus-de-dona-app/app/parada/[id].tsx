import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { COLORS, FONTS } from "../../constants";
import { getParada, getParades } from "../../services/parades";
import { getTextosByParada } from "../../services/textos";
import { Parada, TextDto } from "../../types";

export default function ParadaScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [parada, setParada] = useState<Parada | null>(null);
  const [textos, setTextos] = useState<TextDto[]>([]);
  const [totes, setTotes] = useState<Parada[]>([]);

  useEffect(() => {
    const pid = id as string;
    getParada(pid).then(setParada).catch(() => setParada(null));
    getTextosByParada(pid).then(setTextos).catch(() => setTextos([]));
    getParades().then(setTotes).catch(() => setTotes([]));
  }, [id]);

  if (!parada) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg }}>
        <Text style={{ fontFamily: FONTS.sans, color: COLORS.textSecondary }}>
          Parada no trobada
        </Text>
      </View>
    );
  }

  const idx = totes.findIndex((p) => p.id === id);
  const prevParada = idx > 0 ? totes[idx - 1] : null;
  const nextParada = idx < totes.length - 1 ? totes[idx + 1] : null;

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
            ← Mapa
          </Text>
        </TouchableOpacity>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 3,
            backgroundColor: COLORS.darkBg,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: 9,
              fontWeight: "500",
              color: COLORS.bg,
            }}
          >
            PARADA {parada.ordre} / 10
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text style={{ fontFamily: FONTS.sans, fontSize: 9, color: COLORS.textSecondary }}>
            Guiat
          </Text>
        </View>
      </View>

      <View
        style={{
          height: 110,
          backgroundColor: COLORS.darkBg,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.sans,
            fontSize: 8,
            color: "rgba(255,255,255,0.5)",
            letterSpacing: 0.6,
            textTransform: "uppercase",
            marginTop: 4,
          }}
        >
          {parada.nom_espai}
        </Text>
      </View>

      <View style={{ paddingHorizontal: 14, paddingTop: 8 }}>
        <Text
          style={{
            fontFamily: FONTS.serif,
            fontSize: 13,
            fontWeight: "600",
            color: COLORS.text,
          }}
        >
          {parada.nom_espai}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 3,
            marginTop: 2,
          }}
        >
          <View
            style={{
              width: 5,
              height: 5,
              borderRadius: 2.5,
              backgroundColor: COLORS.love,
            }}
          />
          <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary }}>
            GPS actiu · 38m
          </Text>
        </View>
      </View>

      {textos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ paddingLeft: 14, marginTop: 8 }}
          contentContainerStyle={{ gap: 6, paddingRight: 14 }}
        >
          {textos.map((texto, i) => {
            const autora = texto.autora;
            const initials = autora
              ? `${autora.nom[0]}${autora.cognom[0]}`
              : "??";
            return (
              <TouchableOpacity
                key={texto.id}
                style={{
                  alignItems: "center",
                  gap: 3,
                  paddingBottom: 6,
                  borderBottomWidth: i === 0 ? 2 : 0,
                  borderBottomColor: COLORS.text,
                  minWidth: 58,
                }}
              >
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: i === 0 ? COLORS.darkBg : COLORS.textSecondary,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: 8,
                      fontWeight: "500",
                      color: COLORS.bg,
                    }}
                  >
                    {initials}
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 8,
                    color: i === 0 ? COLORS.text : COLORS.textSecondary,
                  }}
                >
                  {autora?.nom.split(" ")[0] ?? "??"}. {autora?.cognom ?? "??"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {textos.length > 0 && (
        <>
          <View style={{ paddingHorizontal: 14, paddingTop: 8 }}>
            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: 10,
                fontStyle: "italic",
                color: COLORS.textSecondary,
                marginBottom: 4,
              }}
            >
              {textos[0].titol}
              {textos[0].obra_origen ? ` · ${textos[0].obra_origen}` : ""}
            </Text>
            <View
              style={{
                borderLeftWidth: 2,
                borderLeftColor: COLORS.text,
                paddingLeft: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.serif,
                  fontStyle: "italic",
                  fontSize: 11,
                  color: COLORS.text,
                  lineHeight: 18,
                  maxHeight: 52,
                  overflow: "hidden",
                }}
                numberOfLines={3}
              >
                {textos[0].contingut}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={{ paddingHorizontal: 14, paddingVertical: 3 }}>
            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: 9,
                color: COLORS.textSecondary,
              }}
            >
              llegir tot el text ↓
            </Text>
          </TouchableOpacity>
        </>
      )}

      <View style={{ flexDirection: "row", gap: 6, paddingHorizontal: 14, paddingVertical: 6 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: COLORS.darkBg,
            paddingVertical: 7,
            borderRadius: 6,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: 9,
              fontWeight: "500",
              color: COLORS.bg,
              textAlign: "center",
            }}
          >
            ▶ Escoltar àudio
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: COLORS.text,
            paddingVertical: 7,
            borderRadius: 6,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: 9,
              fontWeight: "500",
              color: COLORS.text,
              textAlign: "center",
            }}
          >
            🎬 Veure vídeo
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 14,
          paddingVertical: 5,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: COLORS.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={{ color: COLORS.love, fontSize: 10 }}>♥</Text>
          <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.text }}>
            0
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>◎</Text>
          <Text style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.text }}>
            0
          </Text>
        </View>
        {textos.length > 0 && (() => {
          const autora = textos[0].autora;
          return autora ? (
            <TouchableOpacity onPress={() => router.push(`/autora/${autora.id}`)}>
              <Text
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 10,
                  color: COLORS.textSecondary,
                  textDecorationLine: "underline",
                }}
              >
                → fitxa autora
              </Text>
            </TouchableOpacity>
          ) : null;
        })()}
      </View>

      <TouchableOpacity
        style={{
          marginHorizontal: 14,
          marginVertical: 6,
          borderWidth: 1,
          borderColor: "#b09070",
          borderStyle: "dashed",
          borderRadius: 6,
          paddingVertical: 7,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
        }}
      >
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: COLORS.love,
          }}
        />
        <Text
          style={{
            fontFamily: FONTS.sans,
            fontSize: 9,
            color: "#7a6654",
          }}
        >
          Marcar com a visitada
        </Text>
      </TouchableOpacity>

      <View
        style={{
          flexDirection: "row",
          gap: 6,
          paddingHorizontal: 14,
          paddingVertical: 6,
        }}
      >
        {prevParada && (
          <TouchableOpacity
            onPress={() => router.push(`/parada/${prevParada.id}`)}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 6,
              paddingVertical: 5,
              paddingHorizontal: 8,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: 9,
                color: "#5a5040",
              }}
            >
              ← {prevParada.nom_espai}
            </Text>
          </TouchableOpacity>
        )}
        {nextParada && (
          <TouchableOpacity
            onPress={() => router.push(`/parada/${nextParada.id}`)}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: COLORS.text,
              borderRadius: 6,
              paddingVertical: 5,
              paddingHorizontal: 8,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: 9,
                color: COLORS.text,
                textAlign: "right",
              }}
            >
              {nextParada.nom_espai} →
            </Text>
            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: 8,
                color: COLORS.textSecondary,
                textAlign: "right",
              }}
            >
              Parada {nextParada.ordre}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
