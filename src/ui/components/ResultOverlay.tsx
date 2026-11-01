import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from 'react-native';
import { Palette, useStyles } from '../theme';
import { Button } from './Button';
import { Stars } from './Icons';

interface Props {
  won: boolean;
  wonTitle?: string;
  stars: number;
  score: number;
  note?: string | null; // e.g. today's rank
  primary?: { label: string; onPress: () => void; testID: string };
  onRetry: () => void;
  onHome: () => void;
}

export function ResultOverlay({ won, wonTitle = 'Level clear!', stars, score, note, primary, onRetry, onHome }: Props) {
  const styles = useStyles(makeStyles);
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (reduce) {
        enter.setValue(1);
      } else {
        Animated.spring(enter, { toValue: 1, speed: 14, bounciness: 8, useNativeDriver: true }).start();
      }
    });
  }, [enter]);

  const scale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });
  return (
    <View style={[StyleSheet.absoluteFill, styles.backdrop]}>
      <Animated.View style={[styles.card, { opacity: enter, transform: [{ scale }] }]}>
        <Text style={styles.title} testID="result-title" accessibilityRole="header">
          {won ? wonTitle : 'Out of lives'}
        </Text>
        {won && (
          <View style={styles.stars} accessible accessibilityLabel={`${stars} of 3 stars`}>
            <Stars count={stars} size={40} />
          </View>
        )}
        <Text style={styles.score}>{score} points</Text>
        {note ? (
          <Text style={styles.note} testID="result-note">
            {note}
          </Text>
        ) : null}
        <View style={styles.actions}>
          {won && primary ? (
            <Button testID={primary.testID} label={primary.label} onPress={primary.onPress} />
          ) : !won ? (
            <Button testID="retry-button" label="Try again" onPress={onRetry} />
          ) : null}
          {won && <Button label="Replay" variant="ghost" onPress={onRetry} />}
          <Button testID="home-button" label="Home" variant="ghost" onPress={onHome} />
        </View>
      </Animated.View>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    backdrop: {
      backgroundColor: c.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    card: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: c.surface,
      borderRadius: 28,
      paddingHorizontal: 24,
      paddingTop: 28,
      paddingBottom: 24,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8,
    },
    title: { color: c.text, fontSize: 28, fontWeight: '800' },
    stars: { flexDirection: 'row', gap: 6, marginTop: 14 },
    score: { color: c.muted, fontSize: 17, marginTop: 10, fontVariant: ['tabular-nums'] },
    note: { color: c.accent, fontSize: 16, fontWeight: '700', marginTop: 8, textAlign: 'center' },
    actions: { alignSelf: 'stretch', gap: 10, marginTop: 24 },
  });
