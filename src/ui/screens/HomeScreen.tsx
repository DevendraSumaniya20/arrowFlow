import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { totalScore, totalStars } from '../../domain/progress';
import { useProgress } from '../../state/ProgressContext';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { SettingsButton } from '../components/SettingsButton';
import { colors } from '../theme';

interface Props {
  onPlay: (level: number) => void;
  onLevels: () => void;
}

export function HomeScreen({ onPlay, onLevels }: Props) {
  const { progress } = useProgress();
  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <SettingsButton />
      </View>
      <View style={styles.hero}>
        <Logo />
        <Text style={styles.title}>ArrowSwap</Text>
        <Text style={styles.tagline}>Find the free path. Tap arrows in the right order. Clear the board.</Text>
      </View>
      <View style={styles.stats}>
        <Stat label="Stars" value={totalStars(progress)} />
        <Stat label="Score" value={totalScore(progress)} />
        <Stat label="Level" value={progress.unlocked} />
      </View>
      <View style={styles.actions}>
        <Button
          testID="play-button"
          label={`Play level ${progress.unlocked}`}
          onPress={() => onPlay(progress.unlocked)}
        />
        <Button testID="levels-button" label="All levels" variant="ghost" onPress={onLevels} />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24, justifyContent: 'space-between' },
  topBar: { alignItems: 'flex-end' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 40, fontWeight: '800', marginTop: 20 },
  tagline: { color: colors.muted, fontSize: 16, marginTop: 10, textAlign: 'center' },
  stats: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: { color: colors.text, fontSize: 24, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 13, marginTop: 2 },
  actions: { gap: 12 },
});
