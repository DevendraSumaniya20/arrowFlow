import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Palette, useStyles } from '../theme';
import { ChevronLeft } from './Icons';

interface Props {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, onBack, right }: Props) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        hitSlop={8}
        style={styles.side}
        testID="back-button"
        accessibilityRole="button"
        accessibilityLabel="Back">
        <ChevronLeft size={28} />
      </Pressable>
      <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', minHeight: 52 },
    side: { width: 48, height: 48, justifyContent: 'center' },
    right: { alignItems: 'flex-end' },
    title: { flex: 1, textAlign: 'center', color: c.text, fontSize: 18, fontWeight: '700' },
  });
