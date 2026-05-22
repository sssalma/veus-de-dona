import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { getMevesVisites } from "../../services/visites";
import { getParades } from "../../services/parades";

export default function PerfilScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [visitedOrdres, setVisitedOrdres] = useState<Set<number>>(new Set());
  const [visitesCount, setVisitesCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) return;
      Promise.all([getMevesVisites(), getParades()]).then(([visites, parades]) => {
        const paradaMap = new Map(parades.map((p) => [p.id, p.ordre]));
        const ordres = new Set(visites.map((v) => paradaMap.get(v.parada_id)).filter(Boolean) as number[]);
        setVisitedOrdres(ordres);
        setVisitesCount(ordres.size);
      }).catch(() => {});
    }, [isAuthenticated])
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="small" color={COLORS.darkBg} />
      </View>
    );
  }

  const insets = useSafeAreaInsets();
  const initials = user ? `${user.nom[0]}${user.cognom[0]}`.toUpperCase() : "?";

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View
        style={{
          paddingHorizontal: 14,
          paddingTop: insets.top + 6,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.serif,
            fontSize: 13,
            fontWeight: "600",
            color: COLORS.text,
          }}
        >
          Perfil
        </Text>
      </View>

      <ScrollView>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
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
              {initials}
            </Text>
          </View>
          <View>
            <Text
              style={{ fontFamily: FONTS.sans, fontSize: 11, fontWeight: "500", color: COLORS.text }}
            >
              {user ? `${user.nom} ${user.cognom}` : "Convidat"}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: 10,
                color: COLORS.textSecondary,
                marginTop: 2,
              }}
            >
              {user?.email ?? "Sense sessió"}
            </Text>
            {user && (
                <View
                  style={{
                    marginTop: 4,
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    backgroundColor: "#E8E2F0",
                    borderRadius: 10,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: 9,
                      color: "#6B5B8A",
                    }}
                  >
                  {user.rol === "VISITANT" ? "Visitant" : user.rol}
                  {user.procedencia ? ` · ${user.procedencia}` : ""}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 5,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: 10,
                color: COLORS.textSecondary,
              }}
            >
              Progrés de la ruta
            </Text>
            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: 10,
                fontWeight: "500",
                color: COLORS.text,
              }}
            >
              {visitesCount} / 10 parades
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 4, marginTop: 6 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
              const visited = visitedOrdres.has(n);
              return (
                <View
                  key={n}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: visited ? COLORS.accent : COLORS.border,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: 8,
                      fontWeight: "500",
                      color: visited ? COLORS.bg : COLORS.textSecondary,
                    }}
                  >
                    {n}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ paddingHorizontal: 14 }}>
          {[
            { label: "Idioma", value: (user?.idioma ?? "CA").toUpperCase() },
            { label: "Procedència", value: user?.procedencia ?? "—" },
            { label: "Grup escolar", value: user?.es_alumne ? "Sí" : "No" },
          ].map((item, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: "#f0ece4",
              }}
            >
              <Text
                style={{ fontFamily: FONTS.sans, fontSize: 11, color: COLORS.text }}
              >
                {item.label}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                {item.value && (
                  <Text
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: 9,
                      backgroundColor: COLORS.border,
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                      borderRadius: 10,
                      color: "#5a5040",
                    }}
                  >
                    {item.value}
                  </Text>
                )}
              </View>
            </View>
          ))}
          {isAuthenticated ? (
            <TouchableOpacity
              onPress={async () => { await logout(); router.replace("/login"); }}
              style={{ paddingVertical: 8 }}
            >
              <Text
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 11,
                  color: COLORS.love,
                }}
              >
                Tancar sessió
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.push("/login")}
              style={{ paddingVertical: 8 }}
            >
              <Text
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 11,
                  color: COLORS.accent,
                }}
              >
                Iniciar sessió →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
