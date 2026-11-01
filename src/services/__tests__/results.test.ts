import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadOutbox, PendingResult } from '../../data/storage';
import { flushOutbox, mergePending, queueResult } from '../results';

const item = (key: string, score = 100, kind: PendingResult['kind'] = 'level'): PendingResult => ({
  kind,
  key,
  moves: [{ type: 'tap', row: 0, col: 0 }],
  durationMs: 1000,
  score,
});

const respond = (status: number) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve({}) } as Response);

const mockFetch = (...steps: Array<() => Promise<Response>>) => {
  const fn = jest.fn();
  steps.forEach(step => fn.mockImplementationOnce(step));
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
};

describe('result outbox', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('sends in order, drops runs rejected for good, keeps the rest', async () => {
    await queueResult(item('1'));
    await queueResult(item('2'));
    await queueResult(item('3'));
    const fetchMock = mockFetch(
      () => respond(200), // sent
      () => respond(422), // rejected for good: dropped
      () => Promise.reject(new TypeError('offline')), // stop here, keep it
    );

    expect(await flushOutbox('token')).toEqual({ sent: 1, dropped: 1, unauthorized: false });
    expect((await loadOutbox()).map(r => r.key)).toEqual(['3']);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer token');
  });

  // Review finding: a 401 used to drop every queued result.
  it('keeps everything and reports it when the token is no longer valid', async () => {
    await queueResult(item('1'));
    await queueResult(item('2'));
    const fetchMock = mockFetch(() => respond(401));
    expect(await flushOutbox('dead')).toEqual({ sent: 0, dropped: 0, unauthorized: true });
    expect((await loadOutbox()).map(r => r.key)).toEqual(['1', '2']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  // Review finding: a flush fired up to 200 requests into a rate limit.
  it('stops at the first rate-limit instead of hammering the server', async () => {
    for (const k of ['1', '2', '3']) {
      await queueResult(item(k));
    }
    const fetchMock = mockFetch(() => respond(200), () => respond(429));
    expect(await flushOutbox('token')).toMatchObject({ sent: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((await loadOutbox()).map(r => r.key)).toEqual(['2', '3']);
  });

  // Review finding: every win was queued, so the outbox grew without bound.
  it('keeps one pending run per level or day: the best one', () => {
    let list = mergePending([], item('7', 100));
    list = mergePending(list, item('7', 80)); // worse: ignored
    list = mergePending(list, item('2026-11-01', 50, 'daily')); // other key: kept
    list = mergePending(list, item('7', 140)); // better: replaces
    expect(list.map(r => [r.key, r.score])).toEqual([
      ['2026-11-01', 50],
      ['7', 140],
    ]);
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
