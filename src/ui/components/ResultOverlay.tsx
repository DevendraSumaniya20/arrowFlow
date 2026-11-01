import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { Button } from './Button';

interface Props {
  won: boolean;
  stars: number;
  score: number;
  onNext: () => void;
  onRetry: () => void;
  onHome: () => void;
}

export function ResultOverlay({ won, stars, score, onNext, onRetry, onHome }: Props) {
  const scale = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, bounciness: 10, useNativeDriver: true }).start();
  }, [scale]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.backdrop]}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <Text style={styles.title} testID="result-title">{won ? 'Level clear!' : 'Out of lives'}</Text>
        {won && (
          <Text style={styles.stars} accessibilityLabel={`${stars} of 3 stars`}>
            {'★'.repeat(stars)}
            <Text style={styles.starOff}>{'★'.repeat(3 - stars)}</Text>
          </Text>
        )}
        <Text style={styles.score}>Score {score}</Text>
        <View style={styles.actions}>
          {won ? (
            <Button testID="next-button" label="Next level" onPress={onNext} />
          ) : (
            <Button testID="retry-button" label="Try again" onPress={onRetry} />
          )}
          {won && <Button label="Replay" variant="ghost" onPress={onRetry} />}
          <Button testID="home-button" label="Home" variant="ghost" onPress={onHome} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  stars: { color: colors.star, fontSize: 44, marginTop: 12, letterSpacing: 6 },
  starOff: { color: colors.border },
  score: { color: colors.muted, fontSize: 18, marginTop: 8 },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 24 },
});
