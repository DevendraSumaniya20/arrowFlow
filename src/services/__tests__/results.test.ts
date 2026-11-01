import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadOutbox, PendingResult } from '../../data/storage';
import { flushOutbox, queueResult } from '../results';

const item = (key: string): PendingResult => ({
  kind: 'level',
  key,
  moves: [{ type: 'tap', row: 0, col: 0 }],
  durationMs: 1000,
});

const respond = (status: number) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve({}) } as Response);

describe('result outbox', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('keeps results that failed for retryable reasons and drops rejected ones', async () => {
    await queueResult(item('1'));
    await queueResult(item('2'));
    await queueResult(item('3'));
    globalThis.fetch = jest
      .fn()
      .mockImplementationOnce(() => respond(200)) // sent
      .mockImplementationOnce(() => respond(422)) // rejected for good: dropped
      .mockImplementationOnce(() => Promise.reject(new TypeError('offline'))); // kept

    expect(await flushOutbox('token')).toBe(2);
    expect((await loadOutbox()).map(r => r.key)).toEqual(['3']);
    expect((globalThis.fetch as jest.Mock).mock.calls[0][1].headers.Authorization).toBe('Bearer token');
  });

  it('caps the queue so storage cannot grow forever', async () => {
    for (let i = 0; i < 205; i++) {
      await queueResult(item(String(i)));
    }
    const queued = await loadOutbox();
    expect(queued).toHaveLength(200);
    expect(queued[0].key).toBe('5');
  });
});
