import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { COLORS, FONTS } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [nom, setNom] = useState("");
  const [cognom, setCognom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!nom || !cognom || !email || !password) {
      Alert.alert("Error", "Omple tots els camps");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "La contrasenya ha de tenir almenys 6 caràcters");
      return;
    }
    setLoading(true);
    try {
      await register({ nom, cognom, email, password });
      router.replace("/(tabs)");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Error en crear el compte";
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
          Nom
        </Text>
        <TextInput
          placeholder="El teu nom"
          placeholderTextColor={COLORS.textSecondary}
          value={nom}
          onChangeText={setNom}
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
          Cognom
        </Text>
        <TextInput
          placeholder="El teu cognom"
          placeholderTextColor={COLORS.textSecondary}
          value={cognom}
          onChangeText={setCognom}
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
        onPress={handleRegister}
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
          {loading ? "Creant compte..." : "Crear compte"}
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
