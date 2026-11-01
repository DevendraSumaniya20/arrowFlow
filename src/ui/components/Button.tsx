import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Palette, usePalette, useStyles } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'destructive';
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
  icon?: React.ReactNode;
}

export function Button({ label, onPress, variant = 'primary', disabled, style, testID, icon }: Props) {
  const styles = useStyles(makeStyles);
  const c = usePalette();
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
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <View style={styles.row}>
        {icon}
        <Text
          style={[
            styles.label,
            { color: primary ? c.onAccent : variant === 'destructive' ? c.danger : c.text },
          ]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    base: {
      minHeight: 52,
      paddingHorizontal: 20,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    primary: { backgroundColor: c.accent },
    ghost: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
    pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
    disabled: { opacity: 0.45 },
    label: { fontSize: 17, fontWeight: '700' },
  });
