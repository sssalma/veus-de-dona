import { Tabs } from "expo-router";
import { Text } from "react-native";
import { COLORS, FONTS } from "../../constants";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.bg,
          borderTopColor: COLORS.border,
          height: 50,
        },
        tabBarLabelStyle: {
          fontFamily: FONTS.sans,
          fontSize: 8,
          color: COLORS.textSecondary,
          marginBottom: 4,
        },
        tabBarActiveTintColor: COLORS.text,
        tabBarInactiveTintColor: COLORS.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Mapa",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 14 }}>🗺</Text>,
        }}
      />
      <Tabs.Screen
        name="autores"
        options={{
          title: "Autores",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 14 }}>✍️</Text>,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 14 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
