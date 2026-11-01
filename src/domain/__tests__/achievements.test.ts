import { ACHIEVEMENTS, grantAchievements, newlyEarned, RunStats } from '../achievements';
import { applyDailyWin, applyWin, EMPTY_PROGRESS, parseProgress } from '../progress';
import { dailyShareText } from '../share';

const run = (over: Partial<RunStats> = {}): RunStats => ({
  kind: 'level',
  size: 6,
  mistakes: 1,
  hintsUsed: 1,
  undosUsed: 0,
  bestStreak: 3,
  durationMs: 90_000,
  ...over,
});
const ids = (list: { id: string }[]) => list.map(a => a.id).sort();

describe('achievements', () => {
  it('have unique ids', () => {
    expect(new Set(ACHIEVEMENTS.map(a => a.id)).size).toBe(ACHIEVEMENTS.length);
  });

  it('awards the first clear only once', () => {
    const p = applyWin(EMPTY_PROGRESS, 1, 2, 50);
    expect(ids(newlyEarned(p, run()))).toEqual(['first_clear']);
    const granted = grantAchievements(p, run(), '2026-11-01T10:00:00Z');
    expect(granted.achievements).toEqual({ first_clear: '2026-11-01T10:00:00Z' });
    expect(newlyEarned(granted, run())).toEqual([]);
  });

  it('rewards how a run was played', () => {
    const p = grantAchievements(applyWin(EMPTY_PROGRESS, 1, 3, 50), run(), 't');
    expect(ids(newlyEarned(p, run({ mistakes: 0 })))).toEqual(['flawless']);
    expect(ids(newlyEarned(p, run({ mistakes: 0, undosUsed: 1 })))).toEqual([]); // undo is not flawless
    expect(ids(newlyEarned(p, run({ size: 12, hintsUsed: 0 })))).toEqual(['unassisted']);
    expect(ids(newlyEarned(p, run({ size: 8, durationMs: 20_000 })))).toEqual(['quick']);
    expect(ids(newlyEarned(p, run({ bestStreak: 10 })))).toEqual(['combo_10']);
  });

  it('counts daily streaks', () => {
    let p = EMPTY_PROGRESS;
    for (const d of ['2026-10-30', '2026-10-31', '2026-11-01']) {
      p = applyDailyWin(p, d, 3, 10);
    }
    expect(ids(newlyEarned(p, run({ kind: 'daily', date: '2026-11-01' })))).toEqual([
      'daily_first',
      'streak_3',
    ]);
  });

  it('shows counter progress for locked milestones', () => {
    const p = { ...EMPTY_PROGRESS, unlocked: 8 };
    expect(ACHIEVEMENTS.find(a => a.id === 'levels_10')!.progress!(p)).toEqual([7, 10]);
  });

  it('loads saves from before achievements existed', () => {
    expect(parseProgress('{"unlocked":2,"stars":{},"best":{}}').achievements).toEqual({});
  });
});

describe('share text', () => {
  it('is spoiler-free and includes rank and streak', () => {
    expect(
      dailyShareText({ date: '2026-11-01', stars: 2, score: 1105, rank: 4, streak: 3 }, 'en-GB'),
    ).toBe('Arrow Flow · Daily Sun 1 Nov\n★★☆ 1,105 points · #4 today\n🔥 3-day streak');
  });

  it('leaves out rank when offline and streak below two', () => {
    expect(dailyShareText({ date: '2026-11-01', stars: 3, score: 90, rank: null, streak: 1 }, 'en-GB')).toBe(
      'Arrow Flow · Daily Sun 1 Nov\n★★★ 90 points',
    );
  });
});
