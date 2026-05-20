import { useState, useCallback } from "react";
import MapView, { Marker } from "react-native-maps";
import { View, Text } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { GPS_COORDS } from "../../data/parades";
import { getParades } from "../../services/parades";
import { getMevesVisites } from "../../services/visites";
import { useAuth } from "../../contexts/AuthContext";
import { COLORS, FONTS } from "../../constants";
import { Parada } from "../../types";

export default function MapaScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [parades, setParades] = useState<Parada[]>([]);
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      getParades()
        .then(setParades)
        .catch(() => setParades([]));
      if (isAuthenticated) {
        getMevesVisites()
          .then((visites) => setVisitedIds(new Set(visites.map((v) => v.parada_id))))
          .catch(() => {});
      }
    }, [isAuthenticated])
  );

  const actives = parades.filter((p) => p.activa);
  const visitedCount = parades.filter((p) => visitedIds.has(p.id)).length;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.serif,
            fontSize: 13,
            fontWeight: "600",
            color: COLORS.text,
          }}
        >
          La ruta
        </Text>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: 9,
              color: COLORS.textSecondary,
            }}
          >
            GPS ●
          </Text>
        </View>
      </View>

      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 41.119,
          longitude: 1.244,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
      >
        {actives.map((parada) => {
          const coords = GPS_COORDS[parada.coordenades];
          if (!coords) return null;
          const visited = visitedIds.has(parada.id);

          return (
            <Marker
              key={parada.id}
              coordinate={coords}
              title={parada.nom_espai}
              onPress={() => router.push(`/parada/${parada.id}`)}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: visited ? COLORS.accent : COLORS.darkBg,
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: COLORS.bg,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 8,
                    fontWeight: "600",
                    color: COLORS.bg,
                  }}
                >
                  {parada.ordre}
                </Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 5,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: 10,
              color: COLORS.textSecondary,
            }}
          >
            Progrés de la ruta
          </Text>
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: 10,
              fontWeight: "500",
              color: COLORS.text,
            }}
          >
            {visitedCount} / 10
          </Text>
        </View>
        <View
          style={{
            height: 4,
            backgroundColor: COLORS.border,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              backgroundColor: COLORS.accent,
              borderRadius: 2,
              width: `${(visitedCount / 10) * 100}%`,
            }}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 3, marginTop: 5 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <View
              key={n}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: COLORS.border,
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
