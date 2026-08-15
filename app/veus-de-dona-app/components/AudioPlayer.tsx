import { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet } from "react-native";
import { Audio, AVPlaybackStatus } from "expo-av";
import { getRecursosByText, getRecursUrl } from "../services/recursos";
import { COLORS, FONTS } from "../constants";

interface AudioPlayerProps {
  textId: string;
}

export default function AudioPlayer({ textId }: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAudio, setHasAudio] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const animHeight = useRef(new Animated.Value(44)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initAudio();
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, [textId]);

  async function initAudio() {
    setIsLoading(true);
    setHasAudio(false);
    setIsPlaying(false);

    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setSound(null);

    try {
      const recursos = await getRecursosByText(textId);
      const audioRecurs = recursos.find(r => r.tipus === "AUDIO");
      if (!audioRecurs) {
        return;
      }
      setHasAudio(true);

      const url = await getRecursUrl(audioRecurs.id);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: false }
      );
      soundRef.current = newSound;
      setSound(newSound);

      newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch {
      // silently fail - audio not available
    } finally {
      setIsLoading(false);
    }
  }

  const togglePlay = useCallback(async () => {
    if (!sound || isLoading) return;

    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
    }
  }, [sound, isPlaying, isLoading]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animHeight, {
        toValue: isPlaying ? 88 : 44,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(animOpacity, {
        toValue: isPlaying ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isPlaying]);

  if (!hasAudio) return null;

  const icon = isLoading ? "" : isPlaying ? "⏸" : "▶";

  return (
    <Animated.View style={[styles.container, { height: animHeight }]}>
      <TouchableOpacity
        onPress={togglePlay}
        disabled={isLoading}
        style={styles.button}
      >
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label}>
          {isLoading
            ? "Carregant..."
            : isPlaying
              ? "En reproducció"
              : "Escoltar àudio"}
        </Text>
      </TouchableOpacity>
      <Animated.View style={[styles.progressSection, { opacity: animOpacity }]}>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBg,
    borderRadius: 6,
    overflow: "hidden",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 10,
  },
  icon: {
    fontSize: 12,
    color: COLORS.bg,
  },
  label: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: "500",
    color: COLORS.bg,
    textAlign: "center",
  },
  progressSection: {
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  progressTrack: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
  },
  progressFill: {
    width: "60%",
    height: "100%",
    backgroundColor: COLORS.bg,
    borderRadius: 2,
  },
});
