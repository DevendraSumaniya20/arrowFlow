import AsyncStorage from '@react-native-async-storage/async-storage';
import { EMPTY_PROGRESS, parseProgress, Progress } from '../domain/progress';
import { DEFAULT_SETTINGS, parseSettings, Settings } from '../domain/settings';
import type { Move } from '../state/gameReducer';
import type { Player } from './api';

const PROGRESS_KEY = 'arrowswap/progress/v1';
const SETTINGS_KEY = 'arrowswap/settings/v1';
const PLAYER_KEY = 'arrowswap/player/v1';
const OUTBOX_KEY = 'arrowswap/outbox/v1';

async function read<T>(key: string, parse: (raw: string | null) => T, fallback: T): Promise<T> {
  try {
    return parse(await AsyncStorage.getItem(key));
  } catch (e) {
    console.warn(`load ${key} failed`, e);
    return fallback;
  }
}

async function write(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`save ${key} failed`, e);
  }
}

export const loadProgress = () => read(PROGRESS_KEY, parseProgress, EMPTY_PROGRESS);
export const saveProgress = (p: Progress) => write(PROGRESS_KEY, p);
export const loadSettings = () => read(SETTINGS_KEY, parseSettings, DEFAULT_SETTINGS);
export const saveSettings = (s: Settings) => write(SETTINGS_KEY, s);

// shortcut: the player token sits in AsyncStorage; move it to Keychain/Keystore
// (e.g. react-native-keychain) if accounts start holding anything valuable.
const parsePlayer = (raw: string | null): Player | null => {
  try {
    const v = raw ? JSON.parse(raw) : null;
    return v && typeof v.id === 'string' && typeof v.token === 'string' && typeof v.nickname === 'string'
      ? v
      : null;
  } catch {
    return null;
  }
};
export const loadPlayer = () => read(PLAYER_KEY, parsePlayer, null);
export const savePlayer = (p: Player | null) =>
  p ? write(PLAYER_KEY, p) : AsyncStorage.removeItem(PLAYER_KEY).catch(() => {});

/** Results waiting to reach the server (offline when the level was won). */
export interface PendingResult {
  kind: 'daily' | 'level';
  key: string; // date or level number
  moves: Move[];
  durationMs: number;
  score: number; // client-side score, only used to keep the best pending run
}
const parseOutbox = (raw: string | null): PendingResult[] => {
  try {
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};
export const loadOutbox = () => read(OUTBOX_KEY, parseOutbox, []);
export const saveOutbox = (items: PendingResult[]) => write(OUTBOX_KEY, items);
