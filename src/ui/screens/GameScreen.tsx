import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { difficultyOf } from '../../domain/generator';
import { MAX_LIVES, starsFor } from '../../domain/scoring';
import { Level } from '../../domain/types';
import { gameReducer, initGame, Move } from '../../state/gameReducer';
import { Board } from '../components/Board';
import { Bulb, Heart, Restart } from '../components/Icons';
import { ResultOverlay } from '../components/ResultOverlay';
import { ScreenHeader } from '../components/ScreenHeader';
import { SettingsButton } from '../components/SettingsButton';
import { useGameFeedback } from '../hooks/useGameFeedback';
import { Palette, useStyles } from '../theme';

export interface WinResult {
  score: number;
  stars: number;
  moves: Move[];
  durationMs: number;
}

interface Props {
  level: Level;
  title: string;
  wonTitle?: string;
  /** Saves the win; may resolve to a short note for the result card (e.g. rank). */
  onWin: (result: WinResult) => Promise<string | null> | void;
  primary?: { label: string; onPress: () => void; testID: string };
  onHome: () => void;
}

export function GameScreen({ level, title, wonTitle, onWin, primary, onHome }: Props) {
  const styles = useStyles(makeStyles);
  const [state, dispatch] = useReducer(gameReducer, level, initGame);
  const [note, setNote] = useState<string | null>(null);
  const startedAt = useRef(Date.now());

  const onTap = useCallback(
    (row: number, col: number) => dispatch({ type: 'tap', row, col }),
    [],
  );
  const onLeft = useCallback((id: number) => dispatch({ type: 'left', id }), []);

  useGameFeedback(state);

  // A fresh or restarted board restarts the clock.
  useEffect(() => {
    if (state.moves.length === 0) {
      startedAt.current = Date.now();
      setNote(null);
    }
  }, [state.moves.length]);

  const stars = starsFor(state.mistakes);
  useEffect(() => {
    if (state.status !== 'won') {
      return;
    }
    let alive = true;
    Promise.resolve(
      onWin({ score: state.score, stars, moves: state.moves, durationMs: Date.now() - startedAt.current }),
    ).then(n => alive && n && setNote(n));
    return () => {
      alive = false;
    };
    // Report once per win.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  // Let the last arrow finish flying off before the result card.
  const showResult =
    state.status === 'lost' || (state.status === 'won' && state.leaving.length === 0);

  return (
    <View style={styles.root}>
      <ScreenHeader title={title} onBack={onHome} right={<SettingsButton />} />

      <View style={styles.statusRow}>
        <View style={styles.chip}>
          <Text style={styles.chipText} testID="score">
            {state.score} pts
          </Text>
        </View>
        <View
          style={styles.hearts}
          testID="lives"
          accessible
          accessibilityLabel={`${state.lives} of ${MAX_LIVES} lives`}>
          {Array.from({ length: MAX_LIVES }, (_, i) => (
            <Heart key={i} filled={i < state.lives} />
          ))}
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{difficultyOf(level.size)}</Text>
        </View>
      </View>
      <Text style={styles.muted}>
        {state.arrows.length} arrows left
        {state.streak > 1 ? `  ·  combo x${state.streak}` : ''}
      </Text>

      <View style={styles.boardWrap}>
        <Board state={state} onTap={onTap} onLeft={onLeft} />
      </View>

      <View style={styles.footer}>
        <RoundButton
          testID="hint-button"
          label={`Hint, ${state.hintsLeft} left`}
          badge={state.hintsLeft}
          disabled={state.hintsLeft <= 0 || state.hintId !== null || state.status !== 'playing'}
          onPress={() => dispatch({ type: 'hint' })}>
          <Bulb size={26} />
        </RoundButton>
        <RoundButton testID="restart-button" label="Restart level" onPress={() => dispatch({ type: 'restart' })}>
          <Restart size={26} />
        </RoundButton>
      </View>

      {showResult && (
        <ResultOverlay
          won={state.status === 'won'}
          wonTitle={wonTitle}
          stars={stars}
          score={state.score}
          note={note}
          primary={primary}
          onRetry={() => dispatch({ type: 'restart' })}
          onHome={onHome}
        />
      )}
    </View>
  );
}

function RoundButton({
  testID,
  label,
  badge,
  disabled,
  onPress,
  children,
}: {
  testID: string;
  label: string;
  badge?: number;
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.round, (pressed || disabled) && styles.dim]}>
      {children}
      {badge !== undefined && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, paddingHorizontal: 12 },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    chip: {
      minWidth: 76,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: c.surfaceAlt,
      alignItems: 'center',
    },
    chipText: { color: c.text, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
    hearts: { flexDirection: 'row', gap: 4 },
    muted: { color: c.muted, fontSize: 13, textAlign: 'center', marginTop: 10 },
    boardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    footer: { flexDirection: 'row', justifyContent: 'center', gap: 28, paddingVertical: 16 },
    round: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dim: { opacity: 0.45 },
    badge: {
      position: 'absolute',
      top: -2,
      right: -2,
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: { color: c.onAccent, fontSize: 12, fontWeight: '800' },
  });
