import { useState, useCallback, useRef, useEffect } from "react";
import { WebView } from "react-native-webview";
import { View, Text, TouchableOpacity, Alert, Pressable, Linking } from "react-native";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { getParades, getTotesLesParades, toggleParadaActiva } from "../../services/parades";
import { getMevesVisites } from "../../services/visites";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { COLORS, FONTS } from "../../constants";
import { TranslationKey } from "../../i18n/translations";
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

    // Una parada visitada i una de pendent es distingien nomes pel to del
    // pin, cosa que el criteri 1.4.1 no permet: qui no distingeix els colors
    // es quedava sense saber per on va. Ara la visitada va plena i la pendent
    // buida -paper amb la vora de tinta-, que es una diferencia de farciment
    // i es veu igual en escala de grisos.
    function paradaIcon(estat, ordre) {
      var ple = estat === 'visitada';
      var to = estat === 'inactiva' ? '${COLORS.textSecondary}'
             : ple ? '${COLORS.accent}' : '${COLORS.darkBg}';
      var fons = ple ? to : '${COLORS.bg}';
      var lletra = ple ? '${COLORS.bg}' : to;
      return L.divIcon({
        className: '',
        html: '<div class="parada-pin" style="width:26px;height:26px;border-radius:13px;'
            + 'background:' + fons + ';border:2px solid ' + to + ';'
            + 'box-shadow:0 1px 3px rgba(0,0,0,0.35);">'
            + '<span style="color:' + lletra + ';font-size:11px;font-weight:700;'
            + 'font-family:sans-serif;">' + ordre + '</span></div>',
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
        var estat = !p.activa ? 'inactiva' : (visited[p.id] ? 'visitada' : 'pendent');
        var marker = L.marker([p.lat, p.lng], {
          icon: paradaIcon(estat, p.ordre),
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
          fillColor: '${COLORS.userDot}',
          fillOpacity: 1,
        }).addTo(map);
      }
    };

    window.recenter = function (lat, lng) {
      map.setView([lat, lng], map.getZoom());
    };

    // Centra en una parada concreta i hi dibuixa un anell durant uns segons,
    // perque en arribar-hi des de la fitxa es vegi de quina parada parlem.
    var focusRing = null;
    window.focusParada = function (lat, lng) {
      map.setView([lat, lng], 18, { animate: true });
      if (focusRing) { map.removeLayer(focusRing); focusRing = null; }
      focusRing = L.circleMarker([lat, lng], {
        radius: 24,
        color: '${COLORS.accent}',
        weight: 2,
        fill: false,
        opacity: 0.95,
      }).addTo(map);
      setTimeout(function () {
        if (focusRing) { map.removeLayer(focusRing); focusRing = null; }
      }, 2800);
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
  // Parada a enfocar quan s'arriba des de la seva fitxa
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const focusAplicat = useRef<string | null>(null);
  const potModerar = user?.rol === "EDITOR" || user?.rol === "ADMINISTRADOR";
  const [parades, setParades] = useState<Parada[]>([]);
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [satellit, setSatellit] = useState(false);
  // estat real del GPS, per no ensenyar una insígnia decorativa que sempre diu el mateix
  const [gpsEstat, setGpsEstat] = useState<"cercant" | "actiu" | "denegat">("cercant");
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
      satellite: satellit,
    });
    webviewRef.current?.injectJavaScript(`window.updateData(${JSON.stringify(payload)}); true;`);
  }, [webviewReady, parades, visitedIds, satellit]);

  // Enfoca la parada que arriba per parametre, un sol cop per valor: si no,
  // tornar a la pestanya del mapa la tornaria a centrar cada vegada.
  useEffect(() => {
    if (!webviewReady || !focus || focusAplicat.current === focus) return;
    const p = parades.find((x) => x.id === focus);
    if (!p || p.lat == null || p.lng == null) return;
    focusAplicat.current = focus;
    webviewRef.current?.injectJavaScript(`window.focusParada(${p.lat}, ${p.lng}); true;`);
  }, [webviewReady, focus, parades]);

  useEffect(() => {
    if (!webviewReady) return;
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    const sendLocation = (lat: number, lng: number) => {
      userLocRef.current = { lat, lng };
      if (!cancelled) setGpsEstat("actiu");
      webviewRef.current?.injectJavaScript(`window.updateUserLocation(${lat}, ${lng}); true;`);
    };

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (!cancelled) setGpsEstat("denegat");
        return;
      }
      if (cancelled) return;
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
      `${t("parada.stopLabel")} ${parada.ordre} · ${parada.activa ? t("mapa.stopActive") : t("mapa.stopInactive")}`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("mapa.editStop"),
          onPress: () => router.push(`/(admin)/parades/${parada.id}`),
        },
        {
          text: parada.activa ? t("mapa.deactivate") : t("mapa.activate"),
          style: parada.activa ? "destructive" : "default",
          onPress: async () => {
            try {
              const actualitzada = await toggleParadaActiva(parada.id, !parada.activa);
              setParades((prev) => prev.map((p) => (p.id === parada.id ? actualitzada : p)));
            } catch {
              Alert.alert(t("common.error"), t("mapa.toggleError"));
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

  // el progrés es mesura sobre les parades actives de la ruta, no sobre un 10
  // fix: si l'editor en desactiva una, el màxim assolible ha de baixar amb ella
  const actives = parades.filter((p) => p.activa);
  const visitedCount = actives.filter((p) => visitedIds.has(p.id)).length;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingHorizontal: 14,
          paddingTop: insets.top + 6,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        {/* El títol és llarg i la capçalera d'un mapa ha de ser prima: va en
            cos petit i espaiat tancat perquè càpiga en dues línies al costat
            dels controls, en comptes d'ocupar-ne tres tot sol.

            Es desa en majúscula i minúscula i es posa en versaletes aquí: així
            el nom accessible que llegeix el lector de pantalla és "Ruta de les
            13 escriptores...", no una tirallonga de lletres soltes. La caixa
            alta és una decisió tipogràfica, no del text. */}
        <Text
          accessibilityRole="header"
          style={{
            flex: 1,
            fontFamily: FONTS.serif,
            fontSize: 13,
            fontWeight: "600",
            letterSpacing: 0.8,
            lineHeight: 17,
            textTransform: "uppercase",
            color: COLORS.text,
          }}
          maxFontSizeMultiplier={1.3}
        >
          <TitolAmbToponim titol={t("mapa.title")} />
        </Text>

        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <TouchableOpacity
            accessibilityRole="button"
            // el text visible i el nom accessible han de coincidir (WCAG 2.5.3):
            // el botó commuta entre mapa de carrer i satèl·lit, no entre 2D i 3D
            accessibilityLabel={satellit ? t("mapa.satelliteOff") : t("mapa.satelliteOn")}
            accessibilityState={{ selected: satellit }}
            onPress={() => setSatellit((v) => !v)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: satellit ? COLORS.accent : COLORS.controlBorder,
              backgroundColor: satellit ? COLORS.accent : "transparent",
              minHeight: 32,
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: 10,
                color: satellit ? COLORS.bg : COLORS.textSecondary,
              }}
              maxFontSizeMultiplier={1.3}
            >
              {t("mapa.satellite")}
            </Text>
          </TouchableOpacity>
          {/* Rètol d'estat, no control: seia al costat del botó de satèl·lit
              amb la mateixa píndola i la mateixa vora, i tot el que hi havia
              en aquella fila semblava premible. Ara només porta el punt i la
              paraula.

              L'excepció és el permís denegat: aleshores sí que hi ha una cosa
              a fer, i abans l'app t'informava del problema i t'hi deixava
              -calia sortir a la configuració del telèfon i saber què buscar. */}
          <GpsIndicador estat={gpsEstat} t={t} />
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
            borderColor: COLORS.controlBorder,
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
            {visitedCount} / {actives.length}
          </Text>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={t("mapa.progress")}
          accessibilityValue={{ min: 0, max: actives.length, now: visitedCount }}
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
              width: `${actives.length ? (visitedCount / actives.length) * 100 : 0}%`,
            }}
          />
        </View>
        {/* Els punts es distingien nomes pel color, i el de les pendents
            -COLORS.border sobre el fons- donava 1,25:1, molt per sota del 3:1
            que demana el criteri 1.4.11. Ara la visitada va plena i la pendent
            buida: la diferencia es de forma i es veu igual en escala de grisos
            (criteri 1.4.1). La barra i el comptador ja diuen quantes n'hi ha;
            aixo diu quines. */}
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={{ flexDirection: "row", gap: 4, marginTop: 6 }}
        >
          {actives.map((parada) => {
            const feta = visitedIds.has(parada.id);
            return (
              <View
                key={parada.id}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: feta ? COLORS.accent : "transparent",
                  borderWidth: feta ? 0 : 1,
                  borderColor: COLORS.controlBorder,
                }}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}


/**
 * Rètol d'estat del GPS.
 *
 * Els tres estats es distingeixen pel color del punt, i el nom accessible diu
 * en paraules el que el color diu en silenci: qui no distingeix el violeta del
 * vermell no s'ha de quedar sense saber si l'app el localitza (WCAG 1.4.1, el
 * color no pot ser l'únic mitjà per transmetre informació).
 *
 * Quan el permís està denegat deixa de ser un rètol i passa a ser un botó cap
 * a la configuració del sistema, que és l'únic lloc on es pot rectificar.
 */
function GpsIndicador({
  estat,
  t,
}: {
  estat: "cercant" | "actiu" | "denegat";
  t: (key: TranslationKey) => string;
}) {
  const denegat = estat === "denegat";

  const color =
    estat === "actiu"
      ? COLORS.accent
      : denegat
        ? COLORS.love
        : COLORS.textSecondary;

  const etiqueta = denegat
    ? t("mapa.gpsOpenSettings")
    : estat === "actiu"
      ? t("mapa.gpsActiu")
      : t("mapa.gpsCercant");

  const contingut = (
    <>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
      <Text
        style={{
          fontFamily: FONTS.sans,
          fontSize: 11,
          color: denegat ? COLORS.love : COLORS.textSecondary,
          textDecorationLine: denegat ? "underline" : "none",
        }}
        maxFontSizeMultiplier={1.3}
      >
        GPS
      </Text>
    </>
  );

  if (!denegat) {
    return (
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={etiqueta}
        style={{ flexDirection: "row", alignItems: "center", gap: 5, minHeight: 32 }}
      >
        {contingut}
      </View>
    );
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={() => {
        // Un cop denegat el permís, tornar a demanar-lo des de l'app no
        // torna a ensenyar el diàleg del sistema: cal anar a la configuració.
        Linking.openSettings().catch(() => {});
      }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={{ flexDirection: "row", alignItems: "center", gap: 5, minHeight: 32 }}
    >
      {contingut}
    </TouchableOpacity>
  );
}


/**
 * El titol del mapa amb el nom del barri en cursiva.
 *
 * "Part Alta" es un toponim i es queda igual als tres idiomes -no es tradueix-,
 * de manera que es pot trobar dins de la frase sense haver de partir la clau de
 * traduccio en trossos. La cursiva es la mateixa distincio que ja fa servir la
 * pantalla d'accés per al nom del projecte: dins d'un titol en versaletes,
 * separa el nom propi de la descripcio.
 *
 * Si algun dia el toponim desapareix de la frase, es dibuixa el titol sencer
 * sense cursiva en comptes de quedar-se en blanc.
 */
const TOPONIM = "Part Alta";

function TitolAmbToponim({ titol }: { titol: string }) {
  const tall = titol.indexOf(TOPONIM);
  if (tall === -1) return <>{titol}</>;

  return (
    <>
      {titol.slice(0, tall)}
      <Text style={{ fontStyle: "italic" }}>{TOPONIM}</Text>
      {titol.slice(tall + TOPONIM.length)}
    </>
  );
}
