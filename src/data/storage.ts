import AsyncStorage from '@react-native-async-storage/async-storage';
import { EMPTY_PROGRESS, parseProgress, Progress } from '../domain/progress';
import { DEFAULT_SETTINGS, parseSettings, Settings } from '../domain/settings';

const PROGRESS_KEY = 'arrowswap/progress/v1';
const SETTINGS_KEY = 'arrowswap/settings/v1';

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
