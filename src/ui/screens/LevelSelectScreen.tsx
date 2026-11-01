import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useProgress } from '../../state/ProgressContext';
import { Lock, Stars } from '../components/Icons';
import { ScreenHeader } from '../components/ScreenHeader';
import { Palette, usePalette, useStyles } from '../theme';

interface Props {
  onPlay: (level: number) => void;
  onBack: () => void;
}

// Levels are endless (seeded generator), so the list grows a page at a time.
const PAGE = 60;

export function LevelSelectScreen({ onPlay, onBack }: Props) {
  const styles = useStyles(makeStyles);
  const c = usePalette();
  const { progress } = useProgress();
  const [count, setCount] = useState(() => progress.unlocked + PAGE);
  const levels = useMemo(() => Array.from({ length: count }, (_, i) => i + 1), [count]);

  return (
    <View style={styles.root}>
      <ScreenHeader title="Levels" onBack={onBack} />
      <FlatList
        data={levels}
        numColumns={5}
        keyExtractor={n => String(n)}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        onEndReached={() => setCount(n => n + PAGE)}
        onEndReachedThreshold={0.5}
        renderItem={({ item: n }) => {
          const locked = n > progress.unlocked;
          const current = n === progress.unlocked;
          const stars = progress.stars[n] ?? 0;
          return (
            <Pressable
              disabled={locked}
              onPress={() => onPlay(n)}
              accessibilityRole="button"
              accessibilityLabel={locked ? `Level ${n}, locked` : `Level ${n}, ${stars} stars`}
              style={({ pressed }) => [
                styles.tile,
                current && styles.current,
                locked && styles.locked,
                pressed && styles.pressed,
              ]}>
              {locked ? (
                <Lock size={18} color={c.muted} />
              ) : (
                <>
                  <Text style={[styles.num, current && styles.numCurrent]}>{n}</Text>
                  <View style={styles.stars}>
                    <Stars count={stars} size={10} />
                  </View>
                </>
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, paddingHorizontal: 12 },
    list: { paddingTop: 8, paddingBottom: 24, gap: 10 },
    row: { gap: 10 },
    tile: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: 16,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    current: { borderColor: c.accent, borderWidth: 2 },
    locked: { backgroundColor: c.bg },
    pressed: { opacity: 0.7 },
    num: { color: c.text, fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
    numCurrent: { color: c.accent },
    stars: { flexDirection: 'row', marginTop: 3 },
  });
