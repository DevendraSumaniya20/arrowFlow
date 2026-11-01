import React, { useMemo } from 'react';
import { useProgress } from '../../store/hooks';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { generateLevel } from '../../domain/generator';
import { dailyStreak, totalScore, totalStars } from '../../domain/progress';
import { BoardPreview } from '../components/BoardPreview';
import { Button } from '../components/Button';
import { DailyCard } from '../components/DailyCard';
import { Grid, Podium } from '../components/Icons';
import { Logo } from '../components/Logo';
import { SettingsButton } from '../components/SettingsButton';
import { useToday } from '../hooks/useToday';
import { Palette, type, useStyles } from '../theme';

interface Props {
  onPlay: (level: number) => void;
  onDaily: (date: string) => void;
  onLevels: () => void;
  onLeaderboard: () => void;
}

export function HomeScreen({ onPlay, onDaily, onLevels, onLeaderboard }: Props) {
  const styles = useStyles(makeStyles);
  const { progress } = useProgress();
  const { today } = useToday();
  const level = progress.unlocked;
  const next = useMemo(() => generateLevel(level), [level]);
  const { width, height } = useWindowDimensions();
  const previewSize = Math.min(width - 120, height * 0.28, 280);

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <View style={styles.topBar}>
        <SettingsButton />
      </View>
      <View style={styles.brand}>
        <Logo size={36} />
        <Text style={styles.wordmark} accessibilityRole="header">
          Arrow Flow
        </Text>
      </View>

      <DailyCard
        date={today}
        best={progress.daily[today]}
        streak={dailyStreak(progress, today)}
        onPress={() => onDaily(today)}
      />

      <View style={styles.campaign}>
        {/* The real next board, so the campaign shows what it is instead of describing it. */}
        <Pressable
          style={styles.previewWrap}
          onPress={() => onPlay(level)}
          accessibilityRole="button"
          accessibilityLabel={`Preview of level ${level}. Play`}>
          <BoardPreview level={next} size={previewSize} />
        </Pressable>
        <Text style={styles.level}>Level {level}</Text>
        <Text style={styles.summary}>
          {totalStars(progress)} stars · {totalScore(progress).toLocaleString()} points
        </Text>
        <Button
          testID="play-button"
          label={`Play level ${level}`}
          onPress={() => onPlay(level)}
          style={styles.play}
        />
        <View style={styles.row}>
          <Button
            testID="levels-button"
            label="All levels"
            variant="ghost"
            icon={<Grid size={20} />}
            onPress={onLevels}
            style={styles.flex}
          />
          <Button
            testID="leaderboard-button"
            label="Leaderboard"
            variant="ghost"
            icon={<Podium size={20} />}
            onPress={onLeaderboard}
            style={styles.flex}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 16, gap: 20 },
    topBar: { minHeight: 44, alignItems: 'flex-end', justifyContent: 'center', marginBottom: -16 },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    wordmark: { color: c.text, ...type.largeTitle },
    campaign: { flex: 1, justifyContent: 'flex-end', gap: 6 },
    previewWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
    level: { color: c.text, ...type.largeTitle },
    summary: { color: c.muted, ...type.subhead, fontVariant: ['tabular-nums'] },
    play: { marginTop: 18 },
    row: { flexDirection: 'row', gap: 12, marginTop: 6 },
    flex: { flex: 1 },
  });
