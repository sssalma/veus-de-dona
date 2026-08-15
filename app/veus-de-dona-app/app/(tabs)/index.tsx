import { useState, useCallback } from "react";
import MapView, { Marker, Polyline, Callout } from "react-native-maps";
import { View, Text, TouchableOpacity, Platform, Alert, Pressable } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getParades, getTotesLesParades, toggleParadaActiva } from "../../services/parades";
import { getMevesVisites } from "../../services/visites";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { COLORS, FONTS } from "../../constants";
import { Parada } from "../../types";

export default function MapaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const potModerar = user?.rol === "EDITOR" || user?.rol === "ADMINISTRADOR";
  const [parades, setParades] = useState<Parada[]>([]);
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [is3D, setIs3D] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (potModerar ? getTotesLesParades() : getParades())
        .then(setParades)
        .catch(() => setParades([]));
      if (isAuthenticated) {
        getMevesVisites()
          .then((visites) => setVisitedIds(new Set(visites.map((v) => v.parada_id))))
          .catch(() => {});
      }
    }, [isAuthenticated, potModerar])
  );

  const handleLongPressParada = (parada: Parada) => {
    Alert.alert(
      parada.nom_espai,
      `Parada ${parada.ordre} · ${parada.activa ? "Activa" : "Inactiva"}`,
      [
        { text: "Cancel·lar", style: "cancel" },
        {
          text: "Editar parada",
          onPress: () => router.push(`/(admin)/parades/${parada.id}`),
        },
        {
          text: parada.activa ? "Desactivar" : "Activar",
          style: parada.activa ? "destructive" : "default",
          onPress: async () => {
            try {
              const actualitzada = await toggleParadaActiva(parada.id, !parada.activa);
              setParades((prev) => prev.map((p) => (p.id === parada.id ? actualitzada : p)));
            } catch {
              Alert.alert("Error", "No s'ha pogut canviar l'estat de la parada");
            }
          },
        },
      ]
    );
  };

  const actives = parades.filter((p) => p.activa);
  const visitedCount = parades.filter((p) => visitedIds.has(p.id)).length;

  const routeCoords = actives
    .filter((p) => p.lat != null && p.lng != null)
    .map((p) => ({ latitude: p.lat as number, longitude: p.lng as number }));

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
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
          {t("mapa.title")}
        </Text>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={is3D ? "Desactivar mode 3D" : "Activar mode 3D"}
            accessibilityState={{ selected: is3D }}
            onPress={() => setIs3D((v) => !v)}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: is3D ? COLORS.accent : COLORS.border,
              backgroundColor: is3D ? COLORS.accent : "transparent",
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: 9,
                color: is3D ? COLORS.bg : COLORS.textSecondary,
              }}
            >
              3D
            </Text>
          </TouchableOpacity>
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
      </View>

      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 41.1163,
          longitude: 1.2567,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        }}
        showsUserLocation
        showsMyLocationButton
        mapType={is3D ? "satellite" : "standard"}
        pitchEnabled={is3D}
        rotateEnabled={is3D}
        showsBuildings={is3D}
        showsIndoors={is3D}
      >
        <Polyline
          coordinates={routeCoords}
          strokeColor={COLORS.accent}
          strokeWidth={2}
          lineDashPattern={[6, 4]}
        />
        {parades.map((parada) => {
          if (parada.lat == null || parada.lng == null) return null;
          const coords = { latitude: parada.lat, longitude: parada.lng };
          const visited = visitedIds.has(parada.id);

          return (
            <Marker
              key={parada.id}
              coordinate={coords}
              opacity={parada.activa ? 1 : 0.5}
            >
              <Pressable
                onPress={() => parada.activa && router.push(`/parada/${parada.id}`)}
                onLongPress={() => potModerar && handleLongPressParada(parada)}
                delayLongPress={400}
              >
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: !parada.activa ? COLORS.textSecondary : visited ? COLORS.accent : COLORS.darkBg,
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: COLORS.bg,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: 9,
                      fontWeight: "600",
                      color: COLORS.bg,
                    }}
                  >
                    {parada.ordre}
                  </Text>
                </View>
              </Pressable>
              <Callout tooltip onPress={() => parada.activa && router.push(`/parada/${parada.id}`)}>
                <View
                  style={{
                    backgroundColor: COLORS.bg,
                    borderRadius: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    minWidth: 100,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: 10,
                      fontWeight: "600",
                      color: COLORS.text,
                    }}
                  >
                    {parada.nom_espai}
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: 8,
                      color: COLORS.textSecondary,
                      marginTop: 2,
                    }}
                  >
                    {!parada.activa
                      ? "Inactiva · manté polsat per gestionar"
                      : `Parada ${parada.ordre} · ${visited ? "✓ Visitada" : "Pendent"}`}
                  </Text>
                </View>
              </Callout>
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
            {t("mapa.progress")}
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
          {actives.map((parada) => (
            <View
              key={parada.id}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: visitedIds.has(parada.id) ? COLORS.accent : COLORS.border,
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
