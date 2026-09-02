import { useState } from "react";
import { View, Text, TextInput, TextInputProps, TouchableOpacity, ViewStyle, StyleProp } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "../constants";
import { useLanguage } from "../contexts/LanguageContext";

/**
 * Camp de formulari amb etiqueta. Amb `revelable` hi apareix un ull que
 * destapa el que s'escriu.
 */
export default function FormField({
  label,
  style,
  revelable,
  contenidorStyle,
  ...inputProps
}: {
  label: string;
  revelable?: boolean;
  contenidorStyle?: StyleProp<ViewStyle>;
} & TextInputProps) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const ambUll = revelable === true;

  const input = (
    <TextInput
      accessibilityRole="text"
      accessibilityLabel={label}
      placeholderTextColor={COLORS.textSecondary}
      maxFontSizeMultiplier={1.5}
      style={[
        {
          borderWidth: 1,
          borderColor: COLORS.controlBorder,
          borderRadius: 6,
          paddingHorizontal: 10,
          paddingVertical: 8,
          fontFamily: FONTS.sans,
          fontSize: 11,
          color: COLORS.text,
          backgroundColor: COLORS.lightBg,
          minHeight: 44,
        },
        ambUll && { flex: 1, paddingRight: 44 },
        style,
      ]}
      {...inputProps}
      secureTextEntry={ambUll ? !visible : inputProps.secureTextEntry}
    />
  );

  return (
    <View style={[{ gap: 4, marginBottom: 14 }, contenidorStyle]}>
      <Text
        style={{
          fontFamily: FONTS.sans,
          fontSize: 9,
          color: COLORS.textSecondary,
          letterSpacing: 0.6,
          textTransform: "uppercase",
        }}
        maxFontSizeMultiplier={1.4}
      >
        {label}
      </Text>

      {ambUll ? (
        <View style={{ justifyContent: "center" }}>
          {input}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={visible ? t("common.hidePassword") : t("common.showPassword")}
            onPress={() => setVisible((v) => !v)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ position: "absolute", right: 10 }}
          >
            <Ionicons
              name={visible ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      ) : (
        input
      )}
    </View>
  );
}
