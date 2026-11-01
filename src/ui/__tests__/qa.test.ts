import { clampDuration, MAX_DURATION_MS, MIN_MS_PER_TAP } from '../../domain/scoring';
import { offsetFrom, serverNow, syncClock } from '../../services/clock';
import { dailyNote } from '../dailyNote';

// Regression tests for the code-review findings.
describe('daily result note', () => {
  it('never claims a rejected run was saved', () => {
    expect(dailyNote({ status: 'rejected', code: 'daily_closed' })).toBe(
      "This daily has closed, so it can't be ranked.",
    );
    expect(dailyNote({ status: 'rejected', code: 'not_solved' })).toBe(
      "The leaderboard didn't accept this run.",
    );
  });

  it('says what happens to queued runs', () => {
    expect(dailyNote({ status: 'queued', reason: 'offline' })).toMatch(/offline/);
    expect(dailyNote({ status: 'queued', reason: 'not_joined' })).toMatch(/Join/);
    expect(dailyNote({ status: 'queued', reason: 'reauth' })).toMatch(/again/);
    expect(dailyNote({ status: 'sent', score: 1, stars: 3, rank: 4 })).toBe("You're #4 today");
  });
});

describe('play time', () => {
  it('stays inside what the server accepts', () => {
    expect(clampDuration(-500, 0)).toBe(0); // clock went backwards
    expect(clampDuration(3 * MAX_DURATION_MS, 10)).toBe(MAX_DURATION_MS - 1); // left open overnight
    expect(clampDuration(100, 20)).toBe(20 * MIN_MS_PER_TAP); // faster than the server floor
    expect(clampDuration(42_000.4, 20)).toBe(42_000);
  });
});

describe('clock offset', () => {
  it('measures how far the device clock is off from the server', () => {
    const device = Date.parse('2026-11-01T23:58:00Z');
    expect(offsetFrom('2026-11-02T00:03:00Z', device)).toBe(5 * 60_000);
  });
});

// Found while testing the fixes: a response without `now` made every date invalid and crashed the app.
describe('clock sync', () => {
  it('ignores a server reply without a usable time', async () => {
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ date: '2026-11-01' }) } as Response),
    ) as unknown as typeof fetch;
    await syncClock();
    expect(Number.isNaN(serverNow().getTime())).toBe(false);
  });
});
