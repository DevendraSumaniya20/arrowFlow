import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Achievement, ACHIEVEMENTS } from '../../domain/achievements';
import { Progress } from '../../domain/progress';
import { useProgress } from '../../store/hooks';
import { Lock, Trophy } from '../components/Icons';
import { ScreenHeader } from '../components/ScreenHeader';
import { Palette, rounded, type, usePalette, useStyles } from '../theme';

export function AchievementsScreen({ onBack }: { onBack: () => void }) {
  const styles = useStyles(makeStyles);
  const { progress } = useProgress();
  const earned = ACHIEVEMENTS.filter(a => progress.achievements[a.id]).length;

  return (
    <View style={styles.root}>
      <ScreenHeader title="Achievements" onBack={onBack} backLabel="Home" large />
      <Text style={styles.summary} testID="achievements-summary">
        {earned} of {ACHIEVEMENTS.length} earned
      </Text>
      <FlatList
        data={ACHIEVEMENTS}
        keyExtractor={a => a.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={Separator}
        renderItem={({ item, index }) => (
          <Row
            achievement={item}
            progress={progress}
            first={index === 0}
            last={index === ACHIEVEMENTS.length - 1}
          />
        )}
      />
    </View>
  );
}

function Row({
  achievement: a,
  progress,
  first,
  last,
}: {
  achievement: Achievement;
  progress: Progress;
  first: boolean;
  last: boolean;
}) {
  const styles = useStyles(makeStyles);
  const c = usePalette();
  const at = progress.achievements[a.id];
  const counter = !at && a.progress ? a.progress(progress) : null;
  const status = at
    ? `Earned ${new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`
    : counter
    ? `${counter[0]} / ${counter[1]}`
    : 'Locked';

  return (
    <View
      style={[styles.row, first && styles.first, last && styles.last]}
      testID={`achievement-${a.id}`}
      accessible
      accessibilityLabel={`${a.title}. ${a.description} ${at ? 'Earned.' : `Not earned yet. ${status}.`}`}>
      <View style={[styles.badge, at ? styles.badgeOn : styles.badgeOff]}>
        {at ? <Trophy size={20} color={c.onAccent} /> : <Lock size={18} color={c.muted} />}
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, !at && styles.locked]}>{a.title}</Text>
        <Text style={styles.description}>{a.description}</Text>
        {counter && (
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${(counter[0] / counter[1]) * 100}%` }]} />
          </View>
        )}
      </View>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const makeSeparatorStyles = (c: Palette) =>
  StyleSheet.create({
    wrap: { backgroundColor: c.surface },
    line: { height: StyleSheet.hairlineWidth, backgroundColor: c.border, marginLeft: 68 },
  });

function Separator() {
  const styles = useStyles(makeSeparatorStyles);
  return (
    <View style={styles.wrap}>
      <View style={styles.line} />
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, paddingHorizontal: 16 },
    summary: { ...type.subhead, color: c.muted, marginBottom: 12 },
    list: { paddingBottom: 24 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 64,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: c.surface,
    },
    first: rounded(12, 'top'),
    last: rounded(12, 'bottom'),
    badge: { width: 40, height: 40, ...rounded(12), alignItems: 'center', justifyContent: 'center' },
    badgeOn: { backgroundColor: c.accentFill },
    badgeOff: { backgroundColor: c.surfaceAlt },
    body: { flex: 1, gap: 2 },
    title: { ...type.headline, color: c.text },
    locked: { color: c.muted },
    description: { ...type.footnote, color: c.muted },
    track: { height: 4, borderRadius: 2, backgroundColor: c.surfaceAlt, marginTop: 6, overflow: 'hidden' },
    fill: { height: 4, backgroundColor: c.accentFill },
    status: { ...type.footnote, color: c.muted, fontVariant: ['tabular-nums'] },
  });
