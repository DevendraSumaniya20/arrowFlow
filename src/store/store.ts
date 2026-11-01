import { combineReducers, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import {
  loadPlayer,
  loadProgress,
  loadSettings,
  savePlayer,
  saveProgress,
  saveSettings,
} from '../data/storage';
import { playerLoaded, playerSlice } from './playerSlice';
import { progressLoaded, progressSlice } from './progressSlice';
import { settingsLoaded, settingsSlice } from './settingsSlice';

const rootReducer = combineReducers({
  settings: settingsSlice.reducer,
  progress: progressSlice.reducer,
  player: playerSlice.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

/**
 * A fresh store per app mount (and per test). Each slice is saved to
 * AsyncStorage whenever it changes, but never before it has loaded, so stored
 * data is never overwritten with defaults.
 */
export function createAppStore() {
  const persist = createListenerMiddleware<RootState>();
  const save = <K extends keyof RootState>(key: K, write: (s: RootState[K]) => Promise<void>) =>
    persist.startListening({
      predicate: (_a, curr, prev) =>
        (prev[key] as { loaded: boolean }).loaded && curr[key] !== prev[key],
      effect: (_a, api) => write(api.getState()[key]),
    });
  save('settings', s => saveSettings(s.value));
  save('progress', s => saveProgress(s.value));
  save('player', s => savePlayer(s.current));

  const store = configureStore({
    reducer: rootReducer,
    middleware: getDefault => getDefault().prepend(persist.middleware),
  });

  // Hydrate from storage. Loading itself is not saved back: the predicate only
  // fires for changes made after a slice has loaded.
  loadSettings().then(v => store.dispatch(settingsLoaded(v)));
  loadProgress().then(v => store.dispatch(progressLoaded(v)));
  loadPlayer().then(v => store.dispatch(playerLoaded(v)));
  return store;
}

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore['dispatch'];
