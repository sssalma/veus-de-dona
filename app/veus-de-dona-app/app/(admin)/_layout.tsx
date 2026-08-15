import { Stack, Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { COLORS } from "../../constants";

export default function AdminLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="small" color={COLORS.darkBg} />
      </View>
    );
  }

  if (!user || (user.rol !== "EDITOR" && user.rol !== "ADMINISTRADOR")) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
