import { useState, useCallback, useRef, useEffect } from "react";
import { WebView } from "react-native-webview";
import { View, Text, TouchableOpacity, Alert, Pressable } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { getParades, getTotesLesParades, toggleParadaActiva } from "../../services/parades";
import { getMevesVisites } from "../../services/visites";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { COLORS, FONTS } from "../../constants";
import { Parada } from "../../types";

// Mapa basat en Leaflet + OpenStreetMap (dins d'un WebView), en comptes de
// react-native-maps + Google Maps, perque el projecte es mantingui 100% open
// source. El satelit fa servir tiles d'ESRI World Imagery.
const MAP_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: ${COLORS.bg}; }
    .parada-pin { display: flex; align-items: center; justify-content: center; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([41.1163, 1.2567], 16);

    var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 });
    var satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });
    osmLayer.addTo(map);
    var currentBase = osmLayer;

    var markersLayer = L.layerGroup().addTo(map);
    var routeLine = null;
    var userMarker = null;

    function post(msg) {
      window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    }

    function paradaIcon(color, ordre) {
      return L.divIcon({
        className: '',
        html: '<div class="parada-pin" style="width:26px;height:26px;border-radius:13px;background:' + color + ';border:2px solid ${COLORS.bg};box-shadow:0 1px 3px rgba(0,0,0,0.35);"><span style="color:${COLORS.bg};font-size:11px;font-weight:600;font-family:sans-serif;">' + ordre + '</span></div>',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
    }

    window.updateData = function (dataStr) {
      var data = JSON.parse(dataStr);

      if (data.satellite && currentBase !== satelliteLayer) {
        map.removeLayer(currentBase);
        satelliteLayer.addTo(map);
        currentBase = satelliteLayer;
      } else if (!data.satellite && currentBase !== osmLayer) {
        map.removeLayer(currentBase);
        osmLayer.addTo(map);
        currentBase = osmLayer;
      }

      markersLayer.clearLayers();
      if (routeLine) { map.removeLayer(routeLine); routeLine = null; }

      var visited = {};
      data.visitedIds.forEach(function (id) { visited[id] = true; });

      var routeCoords = data.parades.map(function (p) { return [p.lat, p.lng]; });
      if (routeCoords.length > 1) {
        routeLine = L.polyline(routeCoords, {
          color: '${COLORS.accent}',
          weight: 2,
          dashArray: '6,4',
        }).addTo(map);
      }

      data.parades.forEach(function (p) {
        var color = !p.activa ? '${COLORS.textSecondary}' : (visited[p.id] ? '${COLORS.accent}' : '${COLORS.darkBg}');
        var marker = L.marker([p.lat, p.lng], {
          icon: paradaIcon(color, p.ordre),
          opacity: p.activa ? 1 : 0.5,
        });

        var pressTimer = null;
        var longPressed = false;
        marker.on('mousedown', function () {
          longPressed = false;
          pressTimer = setTimeout(function () {
            longPressed = true;
            post({ type: 'longpress', id: p.id });
          }, 400);
        });
        marker.on('mouseup', function () {
          if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
          if (!longPressed) post({ type: 'press', id: p.id });
        });

        marker.addTo(markersLayer);
      });
    };

    window.updateUserLocation = function (lat, lng) {
      if (userMarker) {
        userMarker.setLatLng([lat, lng]);
      } else {
        userMarker = L.circleMarker([lat, lng], {
          radius: 7,
          color: '${COLORS.bg}',
          weight: 2,
          fillColor: '#4A90D9',
          fillOpacity: 1,
        }).addTo(map);
      }
    };

    window.recenter = function (lat, lng) {
      map.setView([lat, lng], map.getZoom());
    };

    post({ type: 'ready' });
  </script>
</body>
</html>`;

export default function MapaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const potModerar = user?.rol === "EDITOR" || user?.rol === "ADMINISTRADOR";
  const [parades, setParades] = useState<Parada[]>([]);
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [is3D, setIs3D] = useState(false);
  const [webviewReady, setWebviewReady] = useState(false);
  const webviewRef = useRef<WebView>(null);
  const userLocRef = useRef<{ lat: number; lng: number } | null>(null);

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

  useEffect(() => {
    if (!webviewReady) return;
    const payload = JSON.stringify({
      parades: parades
        .filter((p) => p.lat != null && p.lng != null)
        .map((p) => ({ id: p.id, lat: p.lat, lng: p.lng, ordre: p.ordre, activa: p.activa })),
      visitedIds: Array.from(visitedIds),
      satellite: is3D,
    });
    webviewRef.current?.injectJavaScript(`window.updateData(${payload}); true;`);
  }, [webviewReady, parades, visitedIds, is3D]);

  useEffect(() => {
    if (!webviewReady) return;
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    const sendLocation = (lat: number, lng: number) => {
      userLocRef.current = { lat, lng };
      webviewRef.current?.injectJavaScript(`window.updateUserLocation(${lat}, ${lng}); true;`);
    };

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted" || cancelled) return;
      const last = await Location.getLastKnownPositionAsync();
      if (last) sendLocation(last.coords.latitude, last.coords.longitude);
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
        (loc) => sendLocation(loc.coords.latitude, loc.coords.longitude)
      );
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [webviewReady]);

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

  const handleWebViewMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "ready") {
        setWebviewReady(true);
      } else if (msg.type === "press") {
        const parada = parades.find((p) => p.id === msg.id);
        if (parada?.activa) router.push(`/parada/${parada.id}`);
      } else if (msg.type === "longpress") {
        const parada = parades.find((p) => p.id === msg.id);
        if (parada && potModerar) handleLongPressParada(parada);
      }
    } catch {}
  };

  const handleRecenter = () => {
    if (!userLocRef.current) return;
    webviewRef.current?.injectJavaScript(
      `window.recenter(${userLocRef.current.lat}, ${userLocRef.current.lng}); true;`
    );
  };

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
            accessibilityLabel={is3D ? "Desactivar mode satel·lit" : "Activar mode satel·lit"}
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

      <View style={{ flex: 1 }}>
        <WebView
          ref={webviewRef}
          style={{ flex: 1 }}
          originWhitelist={["*"]}
          source={{ html: MAP_HTML }}
          onMessage={handleWebViewMessage}
          javaScriptEnabled
          domStorageEnabled
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("mapa.recenter")}
          onPress={handleRecenter}
          style={{
            position: "absolute",
            right: 14,
            bottom: 14,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: COLORS.bg,
            borderWidth: 1,
            borderColor: COLORS.border,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 1 },
            elevation: 3,
          }}
        >
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: COLORS.accent,
            }}
          />
        </Pressable>
      </View>

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
