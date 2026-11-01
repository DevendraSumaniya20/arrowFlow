import { dailyDifficulty, generateDailyLevel, isValidDate, utcDate } from '../daily';
import { generateLevel } from '../generator';
import { applyDailyWin, dailyStreak, EMPTY_PROGRESS, parseProgress } from '../progress';

describe('daily challenge', () => {
  it('uses the UTC calendar date', () => {
    expect(utcDate(new Date('2026-11-01T23:59:59-05:00'))).toBe('2026-11-02');
  });

  it('validates real dates only', () => {
    expect(isValidDate('2026-11-01')).toBe(true);
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('2026-1-1')).toBe(false);
  });

  it('gets harder from Monday to Sunday', () => {
    expect(dailyDifficulty('2026-11-02')).toBe(10); // Monday
    expect(dailyDifficulty('2026-11-05')).toBe(22); // Thursday
    expect(dailyDifficulty('2026-11-08')).toBe(34); // Sunday
  });

  it('builds the same board for a date, a different one the next day', () => {
    expect(generateDailyLevel('2026-11-01')).toEqual(generateDailyLevel('2026-11-01'));
    expect(generateDailyLevel('2026-11-01').arrows).not.toEqual(
      generateDailyLevel('2026-11-08').arrows,
    );
  });

  it('leaves campaign levels unchanged (default seed)', () => {
    expect(generateLevel(5)).toEqual(generateLevel(5, 5 * 2654435761));
  });
});

describe('daily progress', () => {
  it('keeps the best daily score', () => {
    let p = applyDailyWin(EMPTY_PROGRESS, '2026-11-01', 2, 100);
    p = applyDailyWin(p, '2026-11-01', 1, 50);
    expect(p.daily['2026-11-01']).toEqual({ score: 100, stars: 2 });
  });

  it('counts consecutive cleared days, today optional', () => {
    let p = EMPTY_PROGRESS;
    for (const d of ['2026-10-29', '2026-10-30', '2026-10-31']) {
      p = applyDailyWin(p, d, 3, 10);
    }
    expect(dailyStreak(p, '2026-11-01')).toBe(3); // not played today yet
    expect(dailyStreak(applyDailyWin(p, '2026-11-01', 3, 10), '2026-11-01')).toBe(4);
    expect(dailyStreak(p, '2026-11-02')).toBe(0); // missed a day
  });

  it('loads saves from before daily existed', () => {
    expect(parseProgress('{"unlocked":3,"stars":{"1":3},"best":{"1":90}}').daily).toEqual({});
  });
});
