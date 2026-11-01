import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function Button({ label, onPress, variant = 'primary', disabled, style, testID }: Props) {
  const primary = variant === 'primary';
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        primary ? styles.primary : styles.ghost,
        (pressed || disabled) && styles.dim,
        style,
      ]}>
      <Text style={[styles.label, primary && styles.primaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: 22,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.accent },
  ghost: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  dim: { opacity: 0.6 },
  label: { color: colors.text, fontSize: 17, fontWeight: '700' },
  primaryLabel: { color: colors.onAccent },
});
