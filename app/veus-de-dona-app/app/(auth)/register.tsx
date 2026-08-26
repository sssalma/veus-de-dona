import { useState } from "react";
import { View, Text, TouchableOpacity, Alert, Switch, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { COLORS, FONTS, PASSWORD_MIN_LENGTH } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import FormField from "../../components/FormField";
import { missatgeError, correuSemblaValid } from "../../services/errors";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { t } = useLanguage();
  const [nom, setNom] = useState("");
  const [cognom, setCognom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Camps opcionals: alimenten les mètriques d'ús de la ruta (procedència i
  // visites escolars). Cap d'ells bloqueja la creació del compte.
  const [procedencia, setProcedencia] = useState("");
  const [esAlumne, setEsAlumne] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!nom || !cognom || !email || !password) {
      Alert.alert(t("common.error"), t("auth.fillAllFields"));
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      Alert.alert(t("common.error"), t("auth.passwordMinLength"));
      return;
    }
    if (!correuSemblaValid(email)) {
      Alert.alert(t("common.error"), t("auth.invalidEmail"));
      return;
    }
    setLoading(true);
    try {
      await register({
        nom,
        cognom,
        email,
        password,
        procedencia: procedencia.trim() || undefined,
        es_alumne: esAlumne,
      });
      router.replace("/(tabs)");
    } catch (err: any) {
      const msg = missatgeError(err, t("auth.registerError"));
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
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 20, paddingVertical: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: FONTS.serif,
            fontStyle: "italic",
            fontSize: 20,
            color: COLORS.text,
            textAlign: "center",
            marginBottom: 16,
          }}
          maxFontSizeMultiplier={1.5}
        >
          Veus de Dona
        </Text>

        <FormField
          label={t("auth.name")}
          placeholder={t("auth.namePlaceholder")}
          value={nom}
          onChangeText={setNom}
          autoComplete="given-name"
          textContentType="givenName"
        />

        <FormField
          label={t("auth.surname")}
          placeholder={t("auth.surnamePlaceholder")}
          value={cognom}
          onChangeText={setCognom}
          autoComplete="family-name"
          textContentType="familyName"
        />

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
          label={`${t("auth.password")} (${t("auth.passwordHint")})`}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
        />

        <Text
          accessibilityRole="header"
          style={{
            fontFamily: FONTS.sans,
            fontSize: 9,
            color: COLORS.textSecondary,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            marginTop: 4,
            marginBottom: 10,
          }}
          maxFontSizeMultiplier={1.4}
        >
          {t("auth.optionalSection")}
        </Text>

        <FormField
          label={t("perfil.origin")}
          placeholder={t("auth.originPlaceholder")}
          value={procedencia}
          onChangeText={setProcedencia}
        />

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            borderWidth: 1,
            borderColor: COLORS.controlBorder,
            borderRadius: 8,
            padding: 12,
            marginBottom: 14,
            minHeight: 44,
          }}
        >
          <Text
            style={{ fontFamily: FONTS.sans, fontSize: 11, color: COLORS.text, flex: 1 }}
            maxFontSizeMultiplier={1.4}
          >
            {t("perfil.schoolGroup")}
          </Text>
          <Switch
            accessibilityRole="switch"
            accessibilityLabel={t("perfil.schoolGroup")}
            accessibilityState={{ checked: esAlumne }}
            value={esAlumne}
            onValueChange={setEsAlumne}
          />
        </View>

        <Text
          style={{
            fontFamily: FONTS.sans,
            fontSize: 9,
            color: COLORS.textSecondary,
            lineHeight: 14,
            marginBottom: 14,
          }}
          maxFontSizeMultiplier={1.5}
        >
          {t("auth.dataNotice")}
        </Text>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t("auth.createAccountButton")}
          accessibilityState={{ disabled: loading, busy: loading }}
          onPress={handleRegister}
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
            {loading ? t("auth.creatingAccount") : t("auth.createAccountButton")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          onPress={() => router.back()}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: 10,
              color: COLORS.textSecondary,
              textAlign: "center",
            }}
            maxFontSizeMultiplier={1.4}
          >
            {t("auth.back")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
