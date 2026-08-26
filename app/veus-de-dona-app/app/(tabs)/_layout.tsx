import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "../../constants";
import { useLanguage } from "../../contexts/LanguageContext";

/**
 * Les tres pestanyes portaven emojis (🗺 ✍️ 👤) dibuixats com a text. Tenien
 * dos problemes: cada sistema operatiu els dibuixa a la seva manera —i amb els
 * seus colors, que no són els de l'aplicació— i, com que eren text, el
 * paràmetre `color` que dona la barra arribava i no es feia servir, de manera
 * que la icona activa i la inactiva es veien igual.
 *
 * Ara són icones de traç d'Ionicons, la mateixa família que ja fa servir la
 * resta de l'app, i sí que agafen el color de l'estat.
 */
export default function TabsLayout() {
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.bg,
          borderTopColor: COLORS.border,
          height: 58,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: FONTS.sans,
          fontSize: 11,
          marginBottom: 6,
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.mapa"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "map" : "map-outline"} size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="autores"
        options={{
          title: t("tabs.autores"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "book" : "book-outline"} size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: t("tabs.perfil"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={21} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
