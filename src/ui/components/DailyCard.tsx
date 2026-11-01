import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { generateDailyLevel } from '../../domain/daily';
import { DailyBest } from '../../domain/progress';
import { Palette, rounded, type, useStyles } from '../theme';
import { BoardPreview } from './BoardPreview';
import { ChevronRight, Flame, Stars } from './Icons';

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface Props {
  date: string;
  best?: DailyBest;
  streak: number;
  onPress: () => void;
}

export function DailyCard({ date, best, streak, onPress }: Props) {
  const styles = useStyles(makeStyles);
  const level = useMemo(() => generateDailyLevel(date), [date]);
  const day = new Date(`${date}T00:00:00Z`);
  const weekday = (day.getUTCDay() + 6) % 7; // 0 = Monday
  const label = day.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <Pressable
      testID="daily-button"
      accessibilityRole="button"
      accessibilityLabel={`Daily challenge, ${label}${best ? `, best ${best.score} points` : ', not played yet'}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.preview}>
        <BoardPreview level={level} size={104} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Daily challenge</Text>
        <Text style={styles.date}>{label}</Text>

        {/* Difficulty climbs through the week; today is the filled step. */}
        <View style={styles.week} accessibilityLabel={`Difficulty ${weekday + 1} of 7`}>
          {WEEK.map((d, i) => (
            <View key={i} style={styles.weekCol}>
              <View
                style={[
                  styles.step,
                  { height: 6 + i * 2 },
                  i < weekday && styles.stepPast,
                  i === weekday && styles.stepToday,
                ]}
              />
              <Text style={[styles.weekDay, i === weekday && styles.weekDayToday]}>{d}</Text>
            </View>
          ))}
        </View>

        <View style={styles.status}>
          {best ? (
            <>
              <Stars count={best.stars} size={14} />
              <Text style={styles.statusText}>Best {best.score}</Text>
            </>
          ) : (
            <Text style={styles.statusText}>Same board for everyone</Text>
          )}
        </View>
        {streak >= 2 && (
          <View style={styles.status}>
            <Flame size={14} />
            <Text style={styles.streak}>{streak}-day streak</Text>
          </View>
        )}
      </View>
      <ChevronRight size={22} />
    </Pressable>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 14,
      ...rounded(20),
      backgroundColor: c.surface,
    },
    pressed: { opacity: 0.7 },
    preview: {
      padding: 6,
      ...rounded(14),
      backgroundColor: c.bg,
    },
    body: { flex: 1, gap: 2 },
    title: { color: c.text, ...type.title3 },
    date: { color: c.muted, ...type.subhead },
    week: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 10 },
    weekCol: { alignItems: 'center', gap: 3 },
    step: { width: 10, borderRadius: 3, backgroundColor: c.surfaceAlt },
    stepPast: { backgroundColor: c.dot },
    stepToday: { backgroundColor: c.accent },
    weekDay: { color: c.muted, ...type.caption2, fontWeight: '600' },
    weekDayToday: { color: c.accent, fontWeight: '700' },
    status: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
    statusText: { color: c.muted, ...type.footnote, marginLeft: 2 },
    streak: { color: c.accent, ...type.footnote, fontWeight: '600' },
  });
