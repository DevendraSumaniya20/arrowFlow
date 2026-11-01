import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Palette, type, useStyles } from '../theme';
import { ChevronLeft } from './Icons';

interface Props {
  title: string;
  onBack: () => void;
  backLabel?: string;
  right?: React.ReactNode;
  /** iOS large title below the bar, for top-level screens. */
  large?: boolean;
}

export function ScreenHeader({ title, onBack, backLabel = 'Back', right, large }: Props) {
  const styles = useStyles(makeStyles);
  return (
    <View>
      <View style={styles.bar}>
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          testID="back-button"
          accessibilityRole="button"
          accessibilityLabel={backLabel}>
          <ChevronLeft size={24} />
          <Text style={styles.backLabel}>{backLabel}</Text>
        </Pressable>
        {large ? (
          <View style={styles.spacer} />
        ) : (
          <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
            {title}
          </Text>
        )}
        <View style={styles.right}>{right}</View>
      </View>
      {large && (
        <Text
          style={styles.largeTitle}
          accessibilityRole="header"
          numberOfLines={1}
          adjustsFontSizeToFit // large accessibility text sizes shrink instead of truncating
          minimumFontScale={0.5}>
          {title}
        </Text>
      )}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    bar: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
    back: { flexDirection: 'row', alignItems: 'center', minWidth: 88, minHeight: 44, marginLeft: -8 },
    pressed: { opacity: 0.5 },
    backLabel: { ...type.body, color: c.accent, marginLeft: -2 },
    title: { flex: 1, textAlign: 'center', ...type.headline, color: c.text },
    spacer: { flex: 1 },
    right: { minWidth: 88, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
    largeTitle: { ...type.largeTitle, color: c.text, marginTop: 2, marginBottom: 8 },
  });
