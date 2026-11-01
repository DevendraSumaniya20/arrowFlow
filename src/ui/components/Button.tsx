import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Palette, rounded, type, usePalette, useStyles } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  /** primary = filled; ghost = Apple "gray" (tinted fill); destructive = gray with red text. */
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
        primary ? styles.primary : styles.gray,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <View style={styles.row}>
        {icon}
        <Text
          style={[
            styles.label,
            { color: primary ? c.onAccent : variant === 'destructive' ? c.danger : c.accent },
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
      minHeight: 50,
      paddingHorizontal: 20,
      ...rounded(12),
      alignItems: 'center',
      justifyContent: 'center',
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    primary: { backgroundColor: c.accentFill },
    gray: { backgroundColor: c.surfaceAlt },
    pressed: { opacity: 0.6 },
    disabled: { opacity: 0.4 },
    label: { ...type.headline },
  });
