import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from "react-native";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

const VARIANT_STYLES: Record<ButtonVariant, { container: ViewStyle; label: TextStyle }> = {
  primary: {
    container: { backgroundColor: "#2D6A4F" },
    label: { color: "#FFFFFF" },
  },
  secondary: {
    container: { backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#2D6A4F" },
    label: { color: "#2D6A4F" },
  },
  ghost: {
    container: { backgroundColor: "transparent" },
    label: { color: "#2D6A4F" },
  },
  danger: {
    container: { backgroundColor: "#D62828" },
    label: { color: "#FFFFFF" },
  },
};

const SIZE_STYLES: Record<ButtonSize, { container: ViewStyle; label: TextStyle }> = {
  sm: {
    container: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
    label: { fontSize: 13, fontWeight: "600" },
  },
  md: {
    container: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    label: { fontSize: 15, fontWeight: "600" },
  },
  lg: {
    container: { paddingVertical: 14, paddingHorizontal: 28, borderRadius: 10 },
    label: { fontSize: 17, fontWeight: "700" },
  },
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  style,
  labelStyle,
}: ButtonProps) {
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        variantStyle.container,
        sizeStyle.container,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyle.label.color as string}
        />
      ) : (
        <Text style={[variantStyle.label, sizeStyle.label, labelStyle]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
});
