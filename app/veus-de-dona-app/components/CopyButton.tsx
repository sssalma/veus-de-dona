import { useState, useRef } from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { COLORS } from "../constants";
import { useLanguage } from "../contexts/LanguageContext";

export default function CopyButton({ text }: { text: string }) {
  const { t } = useLanguage();
  const [copiat, setCopiat] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(text);
    setCopiat(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopiat(false), 1500);
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={copiat ? t("common.copied") : t("common.copyText")}
      onPress={handleCopy}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={{ minHeight: 28, minWidth: 28, alignItems: "center", justifyContent: "center" }}
    >
      <Ionicons
        name={copiat ? "checkmark" : "copy-outline"}
        size={16}
        color={copiat ? COLORS.accent : COLORS.textSecondary}
      />
    </TouchableOpacity>
  );
}
