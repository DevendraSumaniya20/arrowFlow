import React, { useMemo } from 'react';
import { newlyEarned, RunStats } from '../../domain/achievements';
import { generateDailyLevel } from '../../domain/daily';
import { generateLevel } from '../../domain/generator';
import { applyDailyWin, applyWin, dailyStreak } from '../../domain/progress';
import { dailyShareText } from '../../domain/share';
import { usePlayer, useProgress } from '../../store/hooks';
import { dailyNote } from '../dailyNote';
import { GameScreen, WinReport, WinResult } from './GameScreen';

const runStats = (r: WinResult, kind: RunStats['kind'], date?: string): RunStats => ({
  kind,
  date,
  size: r.size,
  mistakes: r.mistakes,
  hintsUsed: r.hintsUsed,
  undosUsed: r.undosUsed,
  bestStreak: r.bestStreak,
  durationMs: r.durationMs,
});

const titles = (list: { id: string; title: string }[]) => list.map(({ id, title }) => ({ id, title }));

export function CampaignGame({
  levelNumber,
  onNext,
  onHome,
}: {
  levelNumber: number;
  onNext: () => void;
  onHome: () => void;
}) {
  const level = useMemo(() => generateLevel(levelNumber), [levelNumber]);
  const { progress, recordWin } = useProgress();
  const { submit } = usePlayer();

  const onWin = (r: WinResult): WinReport => {
    const run = runStats(r, 'level');
    // Same pure rules the store applies, so the card shows exactly what gets saved.
    const unlocked = newlyEarned(applyWin(progress, levelNumber, r.stars, r.score), run);
    recordWin(levelNumber, r.stars, r.score, run);
    // Counts toward the all-time board; queued when offline.
    submit({ kind: 'level', key: String(levelNumber), moves: r.moves, durationMs: r.durationMs, score: r.score });
    return { unlocked: titles(unlocked) };
  };

  return (
    <GameScreen
      level={level}
      title={`Level ${levelNumber}`}
      onWin={onWin}
      primary={{ label: 'Next level', onPress: onNext, testID: 'next-button' }}
      onHome={onHome}
    />
  );
}

export function DailyGame({
  date,
  onLeaderboard,
  onHome,
}: {
  date: string;
  onLeaderboard: () => void;
  onHome: () => void;
}) {
  const level = useMemo(() => generateDailyLevel(date), [date]);
  const { progress, recordDailyWin } = useProgress();
  const { submit } = usePlayer();

  const onWin = async (r: WinResult): Promise<WinReport> => {
    const run = runStats(r, 'daily', date);
    const after = applyDailyWin(progress, date, r.stars, r.score);
    const unlocked = newlyEarned(after, run);
    recordDailyWin(date, r.stars, r.score, run);
    const outcome = await submit({
      kind: 'daily',
      key: date,
      moves: r.moves,
      durationMs: r.durationMs,
      score: r.score,
    });
    const rank = outcome.status === 'sent' ? outcome.rank : null;
    return {
      note: dailyNote(outcome),
      unlocked: titles(unlocked),
      shareText: dailyShareText({ date, stars: r.stars, score: r.score, rank, streak: dailyStreak(after, date) }),
    };
  };

  return (
    <GameScreen
      level={level}
      title="Daily challenge"
      wonTitle="Daily cleared!"
      onWin={onWin}
      primary={{ label: 'See leaderboard', onPress: onLeaderboard, testID: 'leaderboard-cta' }}
      onHome={onHome}
    />
  );
}
