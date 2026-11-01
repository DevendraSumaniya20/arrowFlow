import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { difficultyOf, generateLevel } from '../../domain/generator';
import { MAX_LIVES, starsFor } from '../../domain/scoring';
import { gameReducer, initGame } from '../../state/gameReducer';
import { useProgress } from '../../state/ProgressContext';
import { Board } from '../components/Board';
import { Bulb, Heart, Restart } from '../components/Icons';
import { ResultOverlay } from '../components/ResultOverlay';
import { SettingsButton } from '../components/SettingsButton';
import { useGameFeedback } from '../hooks/useGameFeedback';
import { colors } from '../theme';

interface Props {
  levelNumber: number;
  onNext: () => void;
  onHome: () => void;
}

export function GameScreen({ levelNumber, onNext, onHome }: Props) {
  const level = useMemo(() => generateLevel(levelNumber), [levelNumber]);
  const [state, dispatch] = useReducer(gameReducer, level, initGame);
  const { recordWin } = useProgress();

  const onTap = useCallback(
    (row: number, col: number) => dispatch({ type: 'tap', row, col }),
    [],
  );
  const onLeft = useCallback((id: number) => dispatch({ type: 'left', id }), []);

  useGameFeedback(state);

  const stars = starsFor(state.mistakes);
  useEffect(() => {
    if (state.status === 'won') {
      recordWin(levelNumber, stars, state.score);
    }
    // Record once when the level is won.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  // Let the last arrow finish flying off before the result card.
  const showResult =
    state.status === 'lost' || (state.status === 'won' && state.leaving.length === 0);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={onHome}
          hitSlop={12}
          style={styles.side}
          testID="back-button"
          accessibilityRole="button"
          accessibilityLabel="Back to home">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Level {levelNumber}</Text>
        <View style={[styles.side, styles.right]}>
          <SettingsButton />
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={styles.chip}>
          <Text style={styles.chipText} testID="score">
            ★ {state.score}
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
          disabled={
            state.hintsLeft <= 0 || state.hintId !== null || state.status !== 'playing'
          }
          onPress={() => dispatch({ type: 'hint' })}>
          <Bulb />
        </RoundButton>
        <RoundButton testID="restart-button" label="Restart level" onPress={() => dispatch({ type: 'restart' })}>
          <Restart />
        </RoundButton>
      </View>

      {showResult && (
        <ResultOverlay
          won={state.status === 'won'}
          stars={stars}
          score={state.score}
          onNext={onNext}
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

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  side: { width: 48 },
  right: { alignItems: 'flex-end' },
  back: { color: colors.accent, fontSize: 40, lineHeight: 44 },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  chip: {
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.border,
    alignItems: 'center',
  },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  hearts: { flexDirection: 'row', gap: 4 },
  muted: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 8 },
  boardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
    paddingVertical: 16,
  },
  round: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dim: { opacity: 0.45 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.onAccent, fontSize: 12, fontWeight: '700' },
});
