import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadOutbox } from '../../data/storage';
import { EMPTY_PROGRESS } from '../../domain/progress';
import { submitResult } from '../playerSlice';
import { dailyWon, levelWon, progressReset } from '../progressSlice';
import { settingsUpdated } from '../settingsSlice';
import { createAppStore } from '../store';

const tick = () => new Promise<void>(r => setTimeout(r, 0));

async function loadedStore() {
  const store = createAppStore();
  for (let i = 0; i < 10 && !store.getState().player.loaded; i++) {
    await tick();
  }
  return store;
}

const ok = (body: unknown, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response);

describe('app store', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('hydrates every slice from storage', async () => {
    await AsyncStorage.setItem('arrowswap/settings/v1', '{"sound":false,"vibration":true,"appearance":"dark"}');
    await AsyncStorage.setItem('arrowswap/progress/v1', '{"unlocked":4,"stars":{},"best":{}}');
    const s = (await loadedStore()).getState();
    expect(s.settings).toMatchObject({ loaded: true, value: { sound: false, appearance: 'dark' } });
    expect(s.progress.value.unlocked).toBe(4);
    expect(s.player).toMatchObject({ loaded: true, current: null });
  });

  it('saves a slice after it changes, through the domain rules', async () => {
    const store = await loadedStore();
    store.dispatch(levelWon({ level: 1, stars: 3, score: 120 }));
    store.dispatch(levelWon({ level: 1, stars: 1, score: 40 })); // worse: best kept
    store.dispatch(dailyWon({ date: '2026-11-01', stars: 2, score: 90 }));
    store.dispatch(settingsUpdated({ appearance: 'light' }));
    await tick();
    expect(JSON.parse((await AsyncStorage.getItem('arrowswap/progress/v1'))!)).toEqual({
      unlocked: 2,
      stars: { 1: 3 },
      best: { 1: 120 },
      daily: { '2026-11-01': { score: 90, stars: 2 } },
    });
    expect(JSON.parse((await AsyncStorage.getItem('arrowswap/settings/v1'))!).appearance).toBe('light');
    store.dispatch(progressReset());
    await tick();
    expect(JSON.parse((await AsyncStorage.getItem('arrowswap/progress/v1'))!)).toEqual(EMPTY_PROGRESS);
  });

  // Never write defaults over saved data while it is still loading.
  it('does not save anything before a slice has loaded', async () => {
    const setItem = jest.spyOn(AsyncStorage, 'setItem');
    const store = createAppStore();
    store.dispatch(settingsUpdated({ sound: false })); // before load finished
    await tick();
    await tick();
    expect(setItem).not.toHaveBeenCalled();
    expect(store.getState().settings.loaded).toBe(true);
  });

  describe('submitResult', () => {
    const run = { kind: 'daily' as const, key: '2026-11-01', moves: [], durationMs: 1000, score: 50 };

    it('queues a daily when not joined yet', async () => {
      const store = await loadedStore();
      const outcome = await store.dispatch(submitResult(run)).unwrap();
      expect(outcome).toEqual({ status: 'queued', reason: 'not_joined' });
      expect(await loadOutbox()).toHaveLength(1);
    });

    it('signs out and keeps the run when the token is dead', async () => {
      await AsyncStorage.setItem('arrowswap/player/v1', '{"id":"p","nickname":"Old","token":"dead"}');
      const store = await loadedStore();
      globalThis.fetch = jest.fn(() => ok({ error: 'unauthorized' }, 401)) as unknown as typeof fetch;
      const outcome = await store.dispatch(submitResult(run)).unwrap();
      expect(outcome).toEqual({ status: 'queued', reason: 'reauth' });
      expect(store.getState().player).toMatchObject({ current: null, expired: true });
      expect(await loadOutbox()).toHaveLength(1);
    });

    it('reports a permanent rejection without queueing', async () => {
      await AsyncStorage.setItem('arrowswap/player/v1', '{"id":"p","nickname":"Me","token":"t"}');
      const store = await loadedStore();
      globalThis.fetch = jest.fn(() => ok({ error: 'daily_closed' }, 409)) as unknown as typeof fetch;
      expect(await store.dispatch(submitResult(run)).unwrap()).toEqual({
        status: 'rejected',
        code: 'daily_closed',
      });
      expect(await loadOutbox()).toHaveLength(0);
    });
  });
});
