import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { difficultyOf } from '../../domain/generator';
import { clampDuration, MAX_LIVES, starsFor } from '../../domain/scoring';
import { Level } from '../../domain/types';
import { canUndo, gameReducer, initGame, Move, usedHints, usedUndos } from '../../state/gameReducer';
import { Board } from '../components/Board';
import { Bulb, Heart, Restart, Undo } from '../components/Icons';
import { ResultOverlay } from '../components/ResultOverlay';
import { ScreenHeader } from '../components/ScreenHeader';
import { SettingsButton } from '../components/SettingsButton';
import { useGameFeedback } from '../hooks/useGameFeedback';
import { Palette, type, useStyles } from '../theme';

// RN provides performance.now() at runtime but its TS types omit it.
const monotonicNow = (): number =>
  (globalThis as { performance?: { now(): number } }).performance?.now() ?? Date.now();

export interface WinResult {
  score: number;
  stars: number;
  moves: Move[];
  durationMs: number;
  mistakes: number;
  hintsUsed: number;
  undosUsed: number;
  bestStreak: number;
  size: number;
}

/** What the result card can show after a win. */
export interface WinReport {
  note?: string | null;
  unlocked?: { id: string; title: string }[];
  shareText?: string | null;
}

interface Props {
  level: Level;
  title: string;
  wonTitle?: string;
  /** Saves the win; may resolve to extras for the result card (rank, achievements, share). */
  onWin: (result: WinResult) => Promise<WinReport> | WinReport | void;
  primary?: { label: string; onPress: () => void; testID: string };
  onHome: () => void;
}

export function GameScreen({ level, title, wonTitle, onWin, primary, onHome }: Props) {
  const styles = useStyles(makeStyles);
  const [state, dispatch] = useReducer(gameReducer, level, initGame);
  const [report, setReport] = useState<WinReport>({});
  // Play time counts only while the app is in the foreground (monotonic clock).
  const clock = useRef({ total: 0, since: monotonicNow() as number | null });

  const onTap = useCallback(
    (row: number, col: number) => dispatch({ type: 'tap', row, col }),
    [],
  );
  const onLeft = useCallback((id: number) => dispatch({ type: 'left', id }), []);

  useGameFeedback(state);

  useEffect(() => {
    const sub = AppState.addEventListener('change', s => {
      const c = clock.current;
      if (s === 'active' && c.since === null) {
        c.since = monotonicNow();
      } else if (s !== 'active' && c.since !== null) {
        c.total += monotonicNow() - c.since;
        c.since = null;
      }
    });
    return () => sub.remove();
  }, []);

  // A fresh or restarted board restarts the clock.
  useEffect(() => {
    if (state.moves.length === 0) {
      clock.current = { total: 0, since: monotonicNow() };
      setReport({});
    }
  }, [state.moves.length]);

  const stars = starsFor(state.mistakes);
  useEffect(() => {
    if (state.status !== 'won') {
      return;
    }
    let alive = true;
    const c = clock.current;
    const played = c.total + (c.since === null ? 0 : monotonicNow() - c.since);
    const taps = state.moves.filter(m => m.type === 'tap').length;
    Promise.resolve(
      onWin({
        score: state.score,
        stars,
        moves: state.moves,
        durationMs: clampDuration(played, taps),
        mistakes: state.mistakes,
        hintsUsed: usedHints(state),
        undosUsed: usedUndos(state),
        bestStreak: state.bestStreak,
        size: level.size,
      }),
    )
      .then(r => alive && r && setReport(r))
      .catch(e => console.warn('saving the win failed', e));
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
      <ScreenHeader title={title} onBack={onHome} backLabel="Home" right={<SettingsButton />} />

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
        <RoundButton
          testID="undo-button"
          label={`Undo last mistake, ${state.undosLeft} left`}
          badge={state.undosLeft}
          disabled={!canUndo(state)}
          onPress={() => dispatch({ type: 'undo' })}>
          <Undo size={26} />
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
          note={report.note}
          unlocked={report.unlocked}
          shareText={report.shareText}
          onUndo={canUndo(state) ? () => dispatch({ type: 'undo' }) : undefined}
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
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: c.surfaceAlt,
      alignItems: 'center',
    },
    chipText: { color: c.text, ...type.footnote, fontWeight: '600', fontVariant: ['tabular-nums'] },
    hearts: { flexDirection: 'row', gap: 4 },
    muted: { color: c.muted, ...type.footnote, textAlign: 'center', marginTop: 10 },
    boardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    footer: { flexDirection: 'row', justifyContent: 'center', gap: 24, paddingVertical: 16 },
    round: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: c.surfaceAlt,
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
      backgroundColor: c.accentFill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: { color: c.onAccent, ...type.caption, fontWeight: '700' },
  });
