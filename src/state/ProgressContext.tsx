import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { loadProgress, saveProgress } from '../data/storage';
import { applyDailyWin, applyWin, EMPTY_PROGRESS, Progress } from '../domain/progress';
import { usePersistentState } from './usePersistentState';

interface ProgressValue {
  loaded: boolean;
  progress: Progress;
  recordWin: (level: number, stars: number, score: number) => void;
  recordDailyWin: (date: string, stars: number, score: number) => void;
  resetProgress: () => void;
}

const ProgressContext = createContext<ProgressValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress, loaded] = usePersistentState(
    loadProgress,
    saveProgress,
    EMPTY_PROGRESS,
  );

  const recordWin = useCallback(
    (level: number, stars: number, score: number) =>
      setProgress(p => applyWin(p, level, stars, score)),
    [setProgress],
  );
  const recordDailyWin = useCallback(
    (date: string, stars: number, score: number) =>
      setProgress(p => applyDailyWin(p, date, stars, score)),
    [setProgress],
  );
  const resetProgress = useCallback(() => setProgress(EMPTY_PROGRESS), [setProgress]);

  const value = useMemo(
    () => ({ loaded, progress, recordWin, recordDailyWin, resetProgress }),
    [loaded, progress, recordWin, recordDailyWin, resetProgress],
  );
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error('useProgress must be used inside ProgressProvider');
  }
  return ctx;
}
