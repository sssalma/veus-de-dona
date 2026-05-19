import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { COLORS, FONTS } from "../../constants";
import { AUTORES } from "../../data/autores";

export default function PerfilScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 10,
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
              A
            </Text>
          </View>
          <View>
            <Text
              style={{ fontFamily: FONTS.sans, fontSize: 11, fontWeight: "500", color: COLORS.text }}
            >
              Anna Garcia
            </Text>
            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: 10,
                color: COLORS.textSecondary,
                marginTop: 2,
              }}
            >
              anna@exemple.cat
            </Text>
            <View
              style={{
                marginTop: 4,
                paddingHorizontal: 7,
                paddingVertical: 2,
                backgroundColor: "#E1F5EE",
                borderRadius: 10,
                alignSelf: "flex-start",
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 9,
                  color: "#085041",
                }}
              >
                Visitant · Barcelona
              </Text>
            </View>
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
              0 / 10 parades
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 4, marginTop: 6 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <View
                key={n}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: COLORS.border,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 8,
                    fontWeight: "500",
                    color: COLORS.textSecondary,
                  }}
                >
                  {n}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 14 }}>
          {[
            { label: "Idioma", value: "CA" },
            { label: "Procedència", value: "Barcelona" },
            { label: "Grup escolar", value: "No" },
            { label: "Canviar contrasenya", chevron: true },
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
                {item.chevron && (
                  <Text style={{ fontSize: 10, color: COLORS.textSecondary }}>›</Text>
                )}
              </View>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => router.push("/login")}
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
        </View>
      </ScrollView>
    </View>
  );
}
