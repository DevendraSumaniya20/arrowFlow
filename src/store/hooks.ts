import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { PendingResult } from '../data/storage';
import { RunStats } from '../domain/achievements';
import { Settings } from '../domain/settings';
import { syncReminders } from '../services/reminder';
import { flushResults, registerPlayer, renamePlayer, submitResult } from './playerSlice';
import { dailyWon, levelWon, progressReset } from './progressSlice';
import { settingsUpdated } from './settingsSlice';
import type { AppDispatch, RootState } from './store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

// Screens use these small facades and never touch actions directly.

export function useSettings() {
  const dispatch = useAppDispatch();
  const { loaded, value } = useAppSelector(s => s.settings);
  const updateSettings = useCallback(
    (patch: Partial<Settings>) => dispatch(settingsUpdated(patch)),
    [dispatch],
  );
  return { loaded, settings: value, updateSettings };
}

export function useProgress() {
  const dispatch = useAppDispatch();
  const { loaded, value } = useAppSelector(s => s.progress);
  const recordWin = useCallback(
    (level: number, stars: number, score: number, run?: RunStats) =>
      dispatch(levelWon({ level, stars, score, run })),
    [dispatch],
  );
  const recordDailyWin = useCallback(
    (date: string, stars: number, score: number, run?: RunStats) =>
      dispatch(dailyWon({ date, stars, score, run })),
    [dispatch],
  );
  const resetProgress = useCallback(() => dispatch(progressReset()), [dispatch]);
  return { loaded, progress: value, recordWin, recordDailyWin, resetProgress };
}

export function usePlayer() {
  const dispatch = useAppDispatch();
  const { loaded, current, expired } = useAppSelector(s => s.player);
  // unwrap() rethrows an ApiFailure ({ status, code, message }) for the UI.
  const register = useCallback(
    async (nickname: string) => {
      await dispatch(registerPlayer(nickname)).unwrap();
    },
    [dispatch],
  );
  const rename = useCallback(
    async (nickname: string) => {
      await dispatch(renamePlayer(nickname)).unwrap();
    },
    [dispatch],
  );
  const submit = useCallback(
    (result: PendingResult) => dispatch(submitResult(result)).unwrap(),
    [dispatch],
  );
  return { loaded, player: current, expired, register, rename, submit };
}

/** Delivers queued wins on launch, after joining, and whenever the app returns. */
export function useOutboxSync() {
  const dispatch = useAppDispatch();
  const token = useAppSelector(s => s.player.current?.token);
  useEffect(() => {
    if (!token) {
      return;
    }
    dispatch(flushResults());
    const sub = AppState.addEventListener('change', s => s === 'active' && dispatch(flushResults()));
    return () => sub.remove();
  }, [token, dispatch]);
}

/** Keeps scheduled reminders in step with the setting and cleared dailies. */
export function useReminderSync() {
  const { reminder, reminderTime } = useAppSelector(s => s.settings.value);
  const loaded = useAppSelector(s => s.settings.loaded && s.progress.loaded);
  const daily = useAppSelector(s => s.progress.value.daily);
  useEffect(() => {
    if (!loaded) {
      return;
    }
    const sync = () => syncReminders(reminder, reminderTime, daily).catch(() => {});
    sync();
    const sub = AppState.addEventListener('change', s => s === 'active' && sync());
    return () => sub.remove();
  }, [loaded, reminder, reminderTime, daily]);
}
