import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS } from "../../constants";
import { getAutores } from "../../services/autores";
import { Autora } from "../../types";

export default function AutoresScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [autores, setAutores] = useState<Autora[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getAutores()
      .then(setAutores)
      .catch(() => setAutores([]));
  }, []);

  const filtered = autores.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.nom.toLowerCase().includes(q) ||
      a.cognom.toLowerCase().includes(q) ||
      `${a.nom} ${a.cognom}`.toLowerCase().includes(q)
    );
  });

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View
        style={{
          paddingHorizontal: 14,
          paddingTop: insets.top + 6,
          paddingBottom: 10,
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
      <View style={{ paddingHorizontal: 14, paddingVertical: 8 }}>
        <TextInput
          accessibilityRole="search"
          accessibilityLabel="Cercar autores"
          placeholder="Cercar autora..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{
            borderWidth: 1.5,
            borderColor: COLORS.border,
            borderRadius: 6,
            paddingHorizontal: 10,
            paddingVertical: 10,
            fontFamily: FONTS.sans,
            fontSize: 11,
            color: COLORS.text,
            backgroundColor: COLORS.lightBg,
            minHeight: 44,
          }}
        />
      </View>
      <FlatList
        data={filtered}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 14 }}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: 10,
              color: COLORS.textSecondary,
              fontStyle: "italic",
              textAlign: "center",
              paddingVertical: 20,
            }}
          >
            {searchQuery ? "Cap autora coincideix amb la cerca" : "No hi ha autores"}
          </Text>
        }
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
