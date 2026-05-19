import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { COLORS, FONTS } from "../../constants";

export default function RegisterScreen() {
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.bg,
        paddingHorizontal: 20,
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontFamily: FONTS.serif,
          fontStyle: "italic",
          fontSize: 20,
          color: COLORS.text,
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        Veus de Dona
      </Text>

      <View style={{ gap: 4, marginBottom: 14 }}>
        <Text
          style={{
            fontFamily: FONTS.sans,
            fontSize: 9,
            color: COLORS.textSecondary,
            letterSpacing: 0.6,
            textTransform: "uppercase",
          }}
        >
          Nom
        </Text>
        <TextInput
          placeholder="El teu nom"
          placeholderTextColor={COLORS.textSecondary}
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 6,
            paddingHorizontal: 10,
            paddingVertical: 8,
            fontFamily: FONTS.sans,
            fontSize: 11,
            color: COLORS.text,
            backgroundColor: "#f5f2ec",
          }}
        />
      </View>

      <View style={{ gap: 4, marginBottom: 14 }}>
        <Text
          style={{
            fontFamily: FONTS.sans,
            fontSize: 9,
            color: COLORS.textSecondary,
            letterSpacing: 0.6,
            textTransform: "uppercase",
          }}
        >
          Email
        </Text>
        <TextInput
          placeholder="nom@exemple.cat"
          placeholderTextColor={COLORS.textSecondary}
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 6,
            paddingHorizontal: 10,
            paddingVertical: 8,
            fontFamily: FONTS.sans,
            fontSize: 11,
            color: COLORS.text,
            backgroundColor: "#f5f2ec",
          }}
        />
      </View>

      <View style={{ gap: 4, marginBottom: 14 }}>
        <Text
          style={{
            fontFamily: FONTS.sans,
            fontSize: 9,
            color: COLORS.textSecondary,
            letterSpacing: 0.6,
            textTransform: "uppercase",
          }}
        >
          Contrasenya
        </Text>
        <TextInput
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={COLORS.textSecondary}
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 6,
            paddingHorizontal: 10,
            paddingVertical: 8,
            fontFamily: FONTS.sans,
            fontSize: 11,
            color: COLORS.text,
            backgroundColor: "#f5f2ec",
          }}
        />
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: COLORS.darkBg,
          paddingVertical: 11,
          borderRadius: 8,
          marginBottom: 14,
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.sans,
            fontSize: 11,
            fontWeight: "500",
            color: COLORS.bg,
            textAlign: "center",
          }}
        >
          Crear compte
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text
          style={{
            fontFamily: FONTS.sans,
            fontSize: 10,
            color: COLORS.textSecondary,
            textAlign: "center",
          }}
        >
          ← Tornar
        </Text>
      </TouchableOpacity>
    </View>
  );
}
