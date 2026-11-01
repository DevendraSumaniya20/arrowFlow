import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Palette, rounded, type, useStyles } from '../theme';

interface Props<T extends string> {
  options: [T, string][]; // [value, label]
  value: T;
  onChange: (value: T) => void;
  testIDPrefix: string;
}

/** Apple-style segmented control (32pt track, raised selected segment). */
export function SegmentedControl<T extends string>({ options, value, onChange, testIDPrefix }: Props<T>) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map(([key, label]) => {
        const selected = key === value;
        return (
          <Pressable
            key={key}
            testID={`${testIDPrefix}-${key}`}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            onPress={() => onChange(key)}
            style={[styles.segment, selected && styles.selected]}>
            <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    track: { flexDirection: 'row', backgroundColor: c.surfaceAlt, ...rounded(9), padding: 2 },
    segment: { flex: 1, minHeight: 32, ...rounded(7), alignItems: 'center', justifyContent: 'center' },
    selected: {
      backgroundColor: c.segmentOn,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    text: { ...type.footnote, fontWeight: '500', color: c.text },
    textSelected: { fontWeight: '600' },
  });
