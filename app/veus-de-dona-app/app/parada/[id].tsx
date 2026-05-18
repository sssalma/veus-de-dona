import { useLocalSearchParams } from "expo-router";
import { View, Text } from "react-native";

export default function ParadaScreen() {
  const { id } = useLocalSearchParams();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Parada: {id}</Text>
    </View>
  );
}
