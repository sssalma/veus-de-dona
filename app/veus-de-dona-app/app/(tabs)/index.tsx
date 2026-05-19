import MapView, { Marker } from "react-native-maps";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { PARADES, GPS_COORDS } from "../../data/parades";
import { COLORS, FONTS } from "../../constants";

export default function MapaScreen() {
  const router = useRouter();

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
        {PARADES.filter((p) => p.activa).map((parada) => {
          const coords = GPS_COORDS[parada.coordenades];
          if (!coords) return null;

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
                  backgroundColor: COLORS.darkBg,
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
            0 / 10
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
              backgroundColor: COLORS.text,
              borderRadius: 2,
              width: "0%",
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
