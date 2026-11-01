import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Share as ShareSheet, StyleSheet, Text, View } from 'react-native';
import { Palette, rounded, type, usePalette, useStyles } from '../theme';
import { Button } from './Button';
import { Share, Stars, Trophy, Undo } from './Icons';

interface Props {
  won: boolean;
  wonTitle?: string;
  stars: number;
  score: number;
  note?: string | null; // e.g. today's rank
  primary?: { label: string; onPress: () => void; testID: string };
  unlocked?: { id: string; title: string }[]; // achievements earned by this win
  shareText?: string | null;
  onUndo?: () => void; // offered when the run was lost and an undo is left
  onRetry: () => void;
  onHome: () => void;
}

export function ResultOverlay({
  won,
  wonTitle = 'Level clear!',
  stars,
  score,
  note,
  primary,
  unlocked = [],
  shareText,
  onUndo,
  onRetry,
  onHome,
}: Props) {
  const styles = useStyles(makeStyles);
  const c = usePalette();
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
        {unlocked.length > 0 && (
          <View style={styles.unlocked} testID="unlocked-achievements">
            {unlocked.map(a => (
              <View key={a.id} style={styles.unlockedRow}>
                <Trophy size={18} />
                <Text style={styles.unlockedText}>Achievement unlocked: {a.title}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.actions}>
          {won && primary ? (
            <Button testID={primary.testID} label={primary.label} onPress={primary.onPress} />
          ) : !won ? (
            <>
              {onUndo && (
                <Button
                  testID="undo-mistake-button"
                  label="Undo last mistake (−20)"
                  icon={<Undo size={20} color={c.onAccent} />}
                  onPress={onUndo}
                />
              )}
              <Button
                testID="retry-button"
                label="Try again"
                variant={onUndo ? 'ghost' : 'primary'}
                onPress={onRetry}
              />
            </>
          ) : null}
          {won && shareText ? (
            <Button
              testID="share-button"
              label="Share result"
              variant="ghost"
              icon={<Share size={20} />}
              onPress={() => ShareSheet.share({ message: shareText }).catch(() => {})}
            />
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
      ...rounded(24),
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
    title: { color: c.text, ...type.title1 },
    stars: { flexDirection: 'row', gap: 6, marginTop: 14 },
    score: { color: c.muted, ...type.body, marginTop: 10, fontVariant: ['tabular-nums'] },
    note: { color: c.accent, ...type.headline, marginTop: 8, textAlign: 'center' },
    actions: { alignSelf: 'stretch', gap: 10, marginTop: 24 },
    unlocked: { alignSelf: 'stretch', gap: 8, marginTop: 16 },
    unlockedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      ...rounded(10),
      backgroundColor: c.accentSoft,
    },
    unlockedText: { ...type.subhead, fontWeight: '600', color: c.text, flexShrink: 1 },
  });
