import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { COLORS, FONTS } from "../../constants";
import { getAutores } from "../../services/autores";
import { Autora } from "../../types";

export default function AutoresScreen() {
  const router = useRouter();
  const [autores, setAutores] = useState<Autora[]>([]);

  useEffect(() => {
    getAutores()
      .then(setAutores)
      .catch(() => setAutores([]));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.serif,
            fontSize: 15,
            fontWeight: "600",
            color: COLORS.text,
          }}
        >
          Autores
        </Text>
      </View>
      <FlatList
        data={autores}
        contentContainerStyle={{ padding: 14 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/autora/${item.id}`)}
            style={{
              flexDirection: "row",
              gap: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 6,
              marginBottom: 8,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: COLORS.darkBg,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.serif,
                  fontSize: 16,
                  color: COLORS.bg,
                }}
              >
                {item.nom[0]}
                {item.cognom[0]}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 11,
                  fontWeight: "500",
                  color: COLORS.text,
                }}
              >
                {item.nom} {item.cognom}
              </Text>
              {item.anys_vida && (
                <Text
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 9,
                    color: COLORS.textSecondary,
                    marginTop: 2,
                  }}
                >
                  {item.anys_vida}
                </Text>
              )}
              <Text
              numberOfLines={2}
              style={{
                fontFamily: FONTS.sans,
                fontSize: 9,
                color: COLORS.textSecondary,
                marginTop: 4,
              }}
              >
                {item.bio}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
