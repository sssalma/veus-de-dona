import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "../../constants";
import { useLanguage } from "../../contexts/LanguageContext";

/**
 * Icones d'Ionicons, la família que fa servir la resta de l'app. Agafen el
 * color que dona la barra, de manera que la pestanya activa es distingeix.
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
