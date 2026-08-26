import { View, Text, ScrollView, TouchableOpacity, Alert, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, PROJECTE, ROTUL_SECCIO } from "../constants";
import { useLanguage } from "../contexts/LanguageContext";
import { Capcalera } from "../components/Capcalera";
import { Logotip } from "../components/Logotip";

/**
 * Qui hi ha darrere de la ruta, on trobar-ne la resta de material i a qui
 * escriure. L'aplicació parlava de tretze escriptores sense dir enlloc de quin
 * projecte forma part ni de qui és el material.
 */
export default function SobreScreen() {
  const { t } = useLanguage();

  const obrir = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(t("common.error"), t("sobre.openError"));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 36 }}>
        <Capcalera titol={t("perfil.about")} />

        <View style={{ paddingHorizontal: 18, paddingTop: 22, gap: 24 }}>
          <View style={{ gap: 8 }}>
            <Logotip mida={30} />
            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: 14,
                color: COLORS.textSecondary,
                lineHeight: 20,
              }}
              maxFontSizeMultiplier={1.4}
            >
              {t("sobre.leadIn")}
            </Text>
          </View>

          <Apartat titol={t("sobre.projectHeading")} cos={t("sobre.projectBody")} />
          <Apartat titol={t("sobre.appHeading")} cos={t("sobre.appBody")} />

          <Apartat titol={t("sobre.webHeading")} cos={t("sobre.webBody")}>
            <Enllac
              icona="globe-outline"
              text={t("sobre.openWeb")}
              onPress={() => obrir(PROJECTE.web)}
            />
          </Apartat>

          {/* Sense correu configurat no es dibuixa: val més no tenir apartat de
              contacte que tenir-ne un que no porta enlloc. */}
          {PROJECTE.correu !== "" && (
            <Apartat titol={t("sobre.contactHeading")} cos={t("sobre.contactBody")}>
              <Enllac
                icona="mail-outline"
                text={PROJECTE.correu}
                accessibilityLabel={t("sobre.writeEmail")}
                onPress={() => obrir(`mailto:${PROJECTE.correu}`)}
              />
            </Apartat>
          )}

          <Apartat titol={t("sobre.licenceHeading")} cos={t("sobre.licenceBody")}>
            <Enllac
              icona="logo-github"
              text={PROJECTE.repositori.replace("https://", "")}
              onPress={() => obrir(PROJECTE.repositori)}
            />
          </Apartat>
        </View>
      </ScrollView>
    </View>
  );
}

function Apartat({
  titol,
  cos,
  children,
}: {
  titol: string;
  cos: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text accessibilityRole="header" style={ROTUL_SECCIO} maxFontSizeMultiplier={1.4}>
        {titol}
      </Text>
      <Text
        style={{ fontFamily: FONTS.sans, fontSize: 14, color: COLORS.text, lineHeight: 21 }}
        maxFontSizeMultiplier={1.4}
      >
        {cos}
      </Text>
      {children}
    </View>
  );
}

function Enllac({
  icona,
  text,
  accessibilityLabel,
  onPress,
}: {
  icona: React.ComponentProps<typeof Ionicons>["name"];
  text: string;
  accessibilityLabel?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel ?? text}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 2,
        minHeight: 44,
      }}
    >
      <Ionicons name={icona} size={17} color={COLORS.accent} />
      <Text
        style={{
          flex: 1,
          fontFamily: FONTS.sans,
          fontSize: 14,
          fontWeight: "600",
          color: COLORS.accent,
        }}
        maxFontSizeMultiplier={1.4}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
}
