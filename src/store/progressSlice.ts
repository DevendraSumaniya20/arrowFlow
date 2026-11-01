import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { grantAchievements, RunStats } from '../domain/achievements';
import { applyDailyWin, applyWin, EMPTY_PROGRESS, Progress } from '../domain/progress';

interface ProgressState {
  loaded: boolean;
  value: Progress;
}

interface LevelWin {
  level: number;
  stars: number;
  score: number;
  run?: RunStats;
}
interface DailyWin {
  date: string;
  stars: number;
  score: number;
  run?: RunStats;
}
type Stamped = { at: string };

const initialState: ProgressState = { loaded: false, value: EMPTY_PROGRESS };

// Reducers delegate to the pure domain functions, which stay the single source of rules.
export const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    progressLoaded: (_s, a: PayloadAction<Progress>) => ({ loaded: true, value: a.payload }),
    levelWon: {
      reducer: (s, a: PayloadAction<LevelWin & Stamped>) => {
        const p = applyWin(s.value, a.payload.level, a.payload.stars, a.payload.score);
        s.value = a.payload.run ? grantAchievements(p, a.payload.run, a.payload.at) : p;
      },
      // The timestamp is taken here so the reducer stays pure.
      prepare: (win: LevelWin) => ({ payload: { ...win, at: new Date().toISOString() } }),
    },
    dailyWon: {
      reducer: (s, a: PayloadAction<DailyWin & Stamped>) => {
        const p = applyDailyWin(s.value, a.payload.date, a.payload.stars, a.payload.score);
        s.value = a.payload.run ? grantAchievements(p, a.payload.run, a.payload.at) : p;
      },
      prepare: (win: DailyWin) => ({ payload: { ...win, at: new Date().toISOString() } }),
    },
    progressReset: s => {
      s.value = EMPTY_PROGRESS;
    },
  },
});

export const { progressLoaded, levelWon, dailyWon, progressReset } = progressSlice.actions;
