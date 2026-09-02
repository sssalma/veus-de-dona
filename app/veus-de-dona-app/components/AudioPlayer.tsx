import { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio, AVPlaybackStatus } from "expo-av";
import { getRecursUrl } from "../services/recursos";
import { COLORS, FONTS } from "../constants";
import { useLanguage } from "../contexts/LanguageContext";

interface AudioPlayerProps {
  /** Recurs d'àudio del text, o null si no en té. La URL només es resol en
   *  reproduir; la pantalla de parada ja ha consultat quins recursos hi ha. */
  recursId: string | null;
}

function format(ms: number) {
  const total = Math.floor(ms / 1000);
  const min = Math.floor(total / 60);
  const seg = total % 60;
  return `${min}:${seg.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({ recursId }: AudioPlayerProps) {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  // allibera l'àudio en desmuntar o en canviar de recurs
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, [recursId]);

  const togglePlay = useCallback(async () => {
    if (!recursId || isLoading) return;

    if (soundRef.current) {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
      return;
    }

    // primera reproducció: es demana la URL pre-signada
    setIsLoading(true);
    try {
      const url = await getRecursUrl(recursId);
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      soundRef.current = sound;
      setIsPlaying(true);
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;
        setPositionMillis(status.positionMillis);
        setDurationMillis(status.durationMillis ?? 0);
        if (status.didJustFinish) {
          setIsPlaying(false);
          setPositionMillis(0);
        }
      });
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [recursId, isPlaying, isLoading]);

  if (!recursId || hasError) return null;

  const progressPct = durationMillis > 0 ? Math.min(100, (positionMillis / durationMillis) * 100) : 0;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={isPlaying ? t("audio.pause") : t("audio.play")}
      accessibilityState={{ disabled: isLoading, busy: isLoading, selected: isPlaying }}
      onPress={togglePlay}
      disabled={isLoading}
      style={[styles.pindola, isPlaying && styles.pindolaActiva]}
    >
      <Ionicons
        name={isLoading ? "ellipsis-horizontal" : isPlaying ? "pause" : "play"}
        size={15}
        color={isPlaying ? COLORS.bg : COLORS.text}
      />
      <Text
        style={[styles.etiqueta, isPlaying && styles.etiquetaActiva]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.4}
      >
        {isLoading ? t("common.loading") : isPlaying ? t("audio.playing") : t("audio.play")}
      </Text>
      {isPlaying && durationMillis > 0 && (
        <Text style={[styles.temps]} maxFontSizeMultiplier={1.3}>
          {format(positionMillis)} / {format(durationMillis)}
        </Text>
      )}

      {isPlaying && durationMillis > 0 && (
        <View style={styles.pista} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={[styles.progres, { width: `${progressPct}%` }]} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pindola: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.controlBorder,
    overflow: "hidden",
  },
  pindolaActiva: {
    backgroundColor: COLORS.darkBg,
    borderColor: COLORS.darkBg,
  },
  etiqueta: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.text,
    flex: 1,
  },
  etiquetaActiva: {
    color: COLORS.bg,
  },
  temps: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: "rgba(250,248,244,0.75)",
  },
  pista: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  progres: {
    height: "100%",
    backgroundColor: COLORS.bg,
  },
});
