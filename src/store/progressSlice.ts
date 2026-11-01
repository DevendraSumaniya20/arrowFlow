import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { applyDailyWin, applyWin, EMPTY_PROGRESS, Progress } from '../domain/progress';

interface ProgressState {
  loaded: boolean;
  value: Progress;
}

const initialState: ProgressState = { loaded: false, value: EMPTY_PROGRESS };

// Reducers delegate to the pure domain functions, which stay the single source of rules.
export const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    progressLoaded: (_s, a: PayloadAction<Progress>) => ({ loaded: true, value: a.payload }),
    levelWon: (s, a: PayloadAction<{ level: number; stars: number; score: number }>) => {
      s.value = applyWin(s.value, a.payload.level, a.payload.stars, a.payload.score);
    },
    dailyWon: (s, a: PayloadAction<{ date: string; stars: number; score: number }>) => {
      s.value = applyDailyWin(s.value, a.payload.date, a.payload.stars, a.payload.score);
    },
    progressReset: s => {
      s.value = EMPTY_PROGRESS;
    },
  },
});

export const { progressLoaded, levelWon, dailyWon, progressReset } = progressSlice.actions;
