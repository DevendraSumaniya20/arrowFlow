import React, { useMemo } from 'react';
import { usePlayer, useProgress } from '../../store/hooks';
import { generateDailyLevel } from '../../domain/daily';
import { generateLevel } from '../../domain/generator';
import { dailyNote } from '../dailyNote';
import { GameScreen, WinResult } from './GameScreen';

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
  const { recordWin } = useProgress();
  const { submit } = usePlayer();

  const onWin = (r: WinResult) => {
    recordWin(levelNumber, r.stars, r.score);
    // Counts toward the all-time board; queued when offline or not joined yet.
    submit({ kind: 'level', key: String(levelNumber), moves: r.moves, durationMs: r.durationMs, score: r.score });
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
  const { recordDailyWin } = useProgress();
  const { submit } = usePlayer();

  const onWin = async (r: WinResult) => {
    recordDailyWin(date, r.stars, r.score);
    return dailyNote(
      await submit({ kind: 'daily', key: date, moves: r.moves, durationMs: r.durationMs, score: r.score }),
    );
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
