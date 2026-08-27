import { useState } from "react";
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { COLORS, FONTS } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { Logotip } from "../../components/Logotip";
import FormField from "../../components/FormField";
import { missatgeError, correuSemblaValid } from "../../services/errors";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t("common.error"), t("auth.fillAllFields"));
      return;
    }
    if (!correuSemblaValid(email)) {
      Alert.alert(t("common.error"), t("auth.invalidEmail"));
      return;
    }
    setLoading(true);
    try {
      await login({ email, password });
      router.replace("/(tabs)");
    } catch (err: any) {
      const msg = missatgeError(err, t("auth.loginError"));
      Alert.alert(t("common.error"), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: 20 }}>
          <Logotip mida={26} />
        </View>

        <FormField
          label={t("auth.email")}
          placeholder={t("auth.emailPlaceholder")}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />

        <FormField
          label={t("auth.password")}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          revelable
          autoComplete="current-password"
          textContentType="password"
        />

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t("auth.loginButton")}
          accessibilityState={{ disabled: loading, busy: loading }}
          onPress={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: COLORS.darkBg,
            paddingVertical: 11,
            borderRadius: 8,
            marginBottom: 14,
            opacity: loading ? 0.6 : 1,
            minHeight: 44,
            justifyContent: "center",
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
            maxFontSizeMultiplier={1.4}
          >
            {loading ? t("auth.loggingIn") : t("auth.loginButton")}
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
            style={{ fontFamily: FONTS.sans, fontSize: 9, color: COLORS.textSecondary }}
            maxFontSizeMultiplier={1.4}
          >
            {t("auth.or")}
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t("auth.createAccount")}
          onPress={() => router.push("/register")}
          style={{
            borderWidth: 1,
            borderColor: COLORS.controlBorder,
            paddingVertical: 10,
            borderRadius: 8,
            marginBottom: 8,
            minHeight: 44,
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: 11,
              color: COLORS.text,
              textAlign: "center",
            }}
            maxFontSizeMultiplier={1.4}
          >
            {t("auth.createAccount")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t("auth.continueGuest")}
          onPress={() => router.replace("/(tabs)")}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: 10,
              color: COLORS.textSecondary,
              textAlign: "center",
              marginTop: 4,
            }}
            maxFontSizeMultiplier={1.4}
          >
            {t("auth.continueGuest")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
