import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useProgress } from '../../state/ProgressContext';
import { colors } from '../theme';

interface Props {
  onPlay: (level: number) => void;
  onBack: () => void;
}

// Levels are endless (seeded generator), so the list grows a page at a time.
const PAGE = 60;

export function LevelSelectScreen({ onPlay, onBack }: Props) {
  const { progress } = useProgress();
  const [count, setCount] = useState(() => progress.unlocked + PAGE);
  const levels = useMemo(() => Array.from({ length: count }, (_, i) => i + 1), [count]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back to home">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Levels</Text>
        <View style={styles.spacer} />
      </View>
      <FlatList
        data={levels}
        numColumns={5}
        keyExtractor={n => String(n)}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        onEndReached={() => setCount(c => c + PAGE)}
        onEndReachedThreshold={0.5}
        renderItem={({ item: n }) => {
          const locked = n > progress.unlocked;
          const stars = progress.stars[n] ?? 0;
          return (
            <Pressable
              disabled={locked}
              onPress={() => onPlay(n)}
              accessibilityRole="button"
              accessibilityLabel={locked ? `Level ${n}, locked` : `Level ${n}, ${stars} stars`}
              style={({ pressed }) => [
                styles.tile,
                locked && styles.locked,
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.num, locked && styles.lockedText]}>
                {locked ? '🔒' : n}
              </Text>
              {!locked && (
                <Text style={styles.stars}>
                  {'★'.repeat(stars)}
                  <Text style={styles.starOff}>{'★'.repeat(3 - stars)}</Text>
                </Text>
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  back: { color: colors.accent, fontSize: 40, lineHeight: 44, width: 60 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  spacer: { width: 60 },
  list: { paddingBottom: 24, gap: 10 },
  row: { gap: 10 },
  tile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locked: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
  num: { color: colors.text, fontSize: 20, fontWeight: '800' },
  lockedText: { fontSize: 16 },
  stars: { color: colors.star, fontSize: 11, marginTop: 2 },
  starOff: { color: colors.border },
});
