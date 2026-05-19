import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { COLORS, FONTS } from "../constants";

export default function SplashScreen() {
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.darkBg,
        paddingHorizontal: 24,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontFamily: FONTS.serif,
          fontStyle: "italic",
          fontSize: 28,
          color: COLORS.bg,
          textAlign: "center",
          lineHeight: 34,
        }}
      >
        Veus{"\n"}de Dona
      </Text>
      <Text
        style={{
          fontFamily: FONTS.sans,
          fontSize: 10,
          color: "rgba(255,255,255,0.5)",
          letterSpacing: 1.2,
          textTransform: "uppercase",
          marginTop: 4,
        }}
      >
        Ruta literària · Part Alta · Tarragona
      </Text>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 32 }}>
        <View
          style={{
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 20,
            backgroundColor: COLORS.bg,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: 10,
              fontWeight: "500",
              color: COLORS.darkBg,
              letterSpacing: 0.4,
            }}
          >
            CA
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.3)",
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: 10,
              fontWeight: "500",
              color: "rgba(255,255,255,0.7)",
              letterSpacing: 0.4,
            }}
          >
            ES
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.3)",
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: 10,
              fontWeight: "500",
              color: "rgba(255,255,255,0.7)",
              letterSpacing: 0.4,
            }}
          >
            EN
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => router.replace("/(tabs)")}
        style={{
          marginTop: 40,
          width: "100%",
          paddingVertical: 12,
          backgroundColor: COLORS.bg,
          borderRadius: 8,
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.sans,
            fontSize: 11,
            fontWeight: "500",
            color: COLORS.darkBg,
            textAlign: "center",
            letterSpacing: 0.4,
          }}
        >
          Descobrir la ruta →
        </Text>
      </TouchableOpacity>
    </View>
  );
}
