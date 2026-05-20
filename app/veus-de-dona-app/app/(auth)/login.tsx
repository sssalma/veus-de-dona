import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { COLORS, FONTS } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Omple tots els camps");
      return;
    }
    setLoading(true);
    try {
      await login({ email, password });
      router.replace("/(tabs)");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Error en iniciar sessió";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

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
          Email
        </Text>
        <TextInput
          placeholder="nom@exemple.cat"
          placeholderTextColor={COLORS.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
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
          value={password}
          onChangeText={setPassword}
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
        onPress={handleLogin}
        disabled={loading}
        style={{
          backgroundColor: COLORS.darkBg,
          paddingVertical: 11,
          borderRadius: 8,
          marginBottom: 14,
          opacity: loading ? 0.6 : 1,
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
          {loading ? "Entrant..." : "Iniciar sessió"}
        </Text>
      </TouchableOpacity>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
        <Text
          style={{
            fontFamily: FONTS.sans,
            fontSize: 9,
            color: COLORS.textSecondary,
          }}
        >
          o
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
      </View>

      <TouchableOpacity
        onPress={() => router.push("/register")}
        style={{
          borderWidth: 1,
          borderColor: COLORS.border,
          paddingVertical: 10,
          borderRadius: 8,
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.sans,
            fontSize: 11,
            color: COLORS.textSecondary,
            textAlign: "center",
          }}
        >
          Crear compte nou
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
        <Text
          style={{
            fontFamily: FONTS.sans,
            fontSize: 10,
            color: COLORS.textSecondary,
            textAlign: "center",
            marginTop: 4,
          }}
        >
          Continuar sense registre →
        </Text>
      </TouchableOpacity>
    </View>
  );
}
