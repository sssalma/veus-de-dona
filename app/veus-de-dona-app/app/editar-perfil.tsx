import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS, ROTUL_SECCIO, TITOL_PANTALLA } from "../constants";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { updateMeuPerfil, canviarContrasenya } from "../services/usuaris";
import { Capcalera } from "../components/Capcalera";
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
      // Només s'envia el que aquesta pantalla deixa canviar: el servidor fa
      // `exclude_unset`, de manera que la procedència i el grup escolar es
      // queden tal com es van desar al registre.
      const actualitzat = await updateMeuPerfil({
        nom: nom.trim(),
        cognom: cognom.trim(),
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
        <Capcalera titol={t("perfilEdit.title")} />

        <View style={{ padding: 14 }}>
          <Text
            accessibilityRole="header"
            style={[ROTUL_SECCIO, { marginBottom: 10 }]}
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
          {/* La procedència i el grup escolar es recullen una sola vegada, al
              registre: no són preferències sinó dades del moment de l'alta que
              serveixen a l'entitat per saber a qui arriba la ruta. Deixar-les
              editables aquí feia que la xifra pogués anar canviant sota els
              peus de qui la consulta. El perfil les segueix mostrant. */}

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
            style={[ROTUL_SECCIO, { marginBottom: 10 }]}
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
