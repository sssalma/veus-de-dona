import { View, Text, TextInput, TextInputProps } from "react-native";
import { COLORS, FONTS } from "../constants";

export default function FormField({
  label,
  style,
  ...inputProps
}: { label: string } & TextInputProps) {
  return (
    <View style={{ gap: 4, marginBottom: 14 }}>
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
          style,
        ]}
        {...inputProps}
      />
    </View>
  );
}
