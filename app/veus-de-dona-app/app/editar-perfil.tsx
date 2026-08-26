import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS } from "../constants";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { updateMeuPerfil, canviarContrasenya } from "../services/usuaris";
import FormField from "../components/FormField";

// Longitud mínima de contrasenya. El servidor imposa la mateixa regla
// (app/schemas/usuari.py), de manera que no es pot evitar cridant l'API.
const PASSWORD_MIN_LENGTH = 8;

export default function EditarPerfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();
  const { t } = useLanguage();

  const [nom, setNom] = useState(user?.nom ?? "");
  const [cognom, setCognom] = useState(user?.cognom ?? "");
  const [procedencia, setProcedencia] = useState(user?.procedencia ?? "");
  const [esAlumne, setEsAlumne] = useState(!!user?.es_alumne);
  const [desant, setDesant] = useState(false);

  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNova, setPasswordNova] = useState("");
  const [passwordRepetida, setPasswordRepetida] = useState("");
  const [canviant, setCanviant] = useState(false);

  const handleDesarPerfil = async () => {
    if (!nom.trim() || !cognom.trim()) {
      Alert.alert(t("common.error"), t("perfilEdit.nameRequired"));
      return;
    }
    setDesant(true);
    try {
      const actualitzat = await updateMeuPerfil({
        nom: nom.trim(),
        cognom: cognom.trim(),
        procedencia: procedencia.trim() || null,
        es_alumne: esAlumne,
      });
      setUser(actualitzat);
      Alert.alert(t("perfilEdit.savedTitle"), t("perfilEdit.savedMsg"));
      router.back();
    } catch {
      Alert.alert(t("common.error"), t("perfilEdit.saveError"));
    } finally {
      setDesant(false);
    }
  };

  const handleCanviarContrasenya = async () => {
    if (!passwordActual || !passwordNova) {
      Alert.alert(t("common.error"), t("auth.fillAllFields"));
      return;
    }
    if (passwordNova.length < PASSWORD_MIN_LENGTH) {
      Alert.alert(t("common.error"), t("auth.passwordMinLength"));
      return;
    }
    if (passwordNova !== passwordRepetida) {
      Alert.alert(t("common.error"), t("perfilEdit.passwordMismatch"));
      return;
    }
    setCanviant(true);
    try {
      await canviarContrasenya(passwordActual, passwordNova);
      setPasswordActual("");
      setPasswordNova("");
      setPasswordRepetida("");
      Alert.alert(t("perfilEdit.passwordChangedTitle"), t("perfilEdit.passwordChangedMsg"));
    } catch (err: any) {
      const msg =
        err?.response?.status === 401
          ? t("perfilEdit.wrongCurrentPassword")
          : t("perfilEdit.passwordError");
      Alert.alert(t("common.error"), msg);
    } finally {
      setCanviant(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView keyboardShouldPersistTaps="handled">
        <View
          accessibilityRole="header"
          style={{
            paddingHorizontal: 14,
            paddingTop: insets.top + 6,
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          }}
        >
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
            onPress={() => router.back()}
            style={{ marginBottom: 6, minHeight: 44, minWidth: 44, justifyContent: "center" }}
          >
            <Text
              style={{ fontFamily: FONTS.sans, fontSize: 10, color: COLORS.textSecondary }}
              maxFontSizeMultiplier={1.4}
            >
              ← {t("common.back")}
            </Text>
          </TouchableOpacity>
          <Text
            accessibilityRole="header"
            style={{ fontFamily: FONTS.serif, fontSize: 16, fontWeight: "600", color: COLORS.text }}
            maxFontSizeMultiplier={1.5}
          >
            {t("perfilEdit.title")}
          </Text>
        </View>

        <View style={{ padding: 14 }}>
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: FONTS.sans,
              fontSize: 10,
              fontWeight: "600",
              color: COLORS.textSecondary,
              textTransform: "uppercase",
              letterSpacing: 0.4,
              marginBottom: 10,
            }}
            maxFontSizeMultiplier={1.4}
          >
            {t("perfilEdit.personalData")}
          </Text>

          <FormField
            label={t("auth.name")}
            value={nom}
            onChangeText={setNom}
            autoComplete="given-name"
          />
          <FormField
            label={t("auth.surname")}
            value={cognom}
            onChangeText={setCognom}
            autoComplete="family-name"
          />
          <FormField
            label={t("perfil.origin")}
            value={procedencia}
            onChangeText={setProcedencia}
            placeholder={t("auth.originPlaceholder")}
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

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t("common.save")}
            accessibilityState={{ disabled: desant }}
            onPress={handleDesarPerfil}
            disabled={desant}
            style={{
              backgroundColor: COLORS.darkBg,
              paddingVertical: 11,
              borderRadius: 8,
              opacity: desant ? 0.6 : 1,
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
              {desant ? t("perfilEdit.saving") : t("common.save")}
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            padding: 14,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
          }}
        >
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: FONTS.sans,
              fontSize: 10,
              fontWeight: "600",
              color: COLORS.textSecondary,
              textTransform: "uppercase",
              letterSpacing: 0.4,
              marginBottom: 10,
            }}
            maxFontSizeMultiplier={1.4}
          >
            {t("perfilEdit.passwordSection")}
          </Text>

          <FormField
            label={t("perfilEdit.currentPassword")}
            value={passwordActual}
            onChangeText={setPasswordActual}
            secureTextEntry
            autoComplete="current-password"
            placeholder="••••••••"
          />
          <FormField
            label={t("perfilEdit.newPassword")}
            value={passwordNova}
            onChangeText={setPasswordNova}
            secureTextEntry
            autoComplete="new-password"
            placeholder="••••••••"
          />
          <FormField
            label={t("perfilEdit.repeatPassword")}
            value={passwordRepetida}
            onChangeText={setPasswordRepetida}
            secureTextEntry
            autoComplete="new-password"
            placeholder="••••••••"
          />

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t("perfilEdit.changePassword")}
            accessibilityState={{ disabled: canviant }}
            onPress={handleCanviarContrasenya}
            disabled={canviant}
            style={{
              borderWidth: 1,
              borderColor: COLORS.controlBorder,
              paddingVertical: 11,
              borderRadius: 8,
              opacity: canviant ? 0.6 : 1,
              minHeight: 44,
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: 11,
                fontWeight: "500",
                color: COLORS.text,
                textAlign: "center",
              }}
              maxFontSizeMultiplier={1.4}
            >
              {canviant ? t("perfilEdit.changing") : t("perfilEdit.changePassword")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
