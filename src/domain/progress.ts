export interface DailyBest {
  score: number;
  stars: number;
}

export interface Progress {
  unlocked: number; // highest playable level
  stars: Record<number, number>;
  best: Record<number, number>; // best score per level
  daily: Record<string, DailyBest>; // best per daily date (YYYY-MM-DD)
}

export const EMPTY_PROGRESS: Progress = { unlocked: 1, stars: {}, best: {}, daily: {} };

export function applyWin(
  p: Progress,
  level: number,
  stars: number,
  score: number,
): Progress {
  return {
    ...p,
    unlocked: Math.max(p.unlocked, level + 1),
    stars: { ...p.stars, [level]: Math.max(p.stars[level] ?? 0, stars) },
    best: { ...p.best, [level]: Math.max(p.best[level] ?? 0, score) },
  };
}

export function applyDailyWin(p: Progress, date: string, stars: number, score: number): Progress {
  const prev = p.daily[date];
  if (prev && prev.score >= score) {
    return p;
  }
  return { ...p, daily: { ...p.daily, [date]: { score, stars } } };
}

/** Consecutive days with a cleared daily, counting back from today (or yesterday). */
export function dailyStreak(p: Progress, today: string): number {
  const day = new Date(`${today}T00:00:00Z`);
  if (!p.daily[today]) {
    day.setUTCDate(day.getUTCDate() - 1);
  }
  let streak = 0;
  while (p.daily[day.toISOString().slice(0, 10)]) {
    streak++;
    day.setUTCDate(day.getUTCDate() - 1);
  }
  return streak;
}

export const totalStars = (p: Progress) =>
  Object.values(p.stars).reduce((a, b) => a + b, 0);

export const totalScore = (p: Progress) =>
  Object.values(p.best).reduce((a, b) => a + b, 0);

const isNumberRecord = (v: unknown): v is Record<number, number> =>
  typeof v === 'object' &&
  v !== null &&
  Object.values(v).every(x => typeof x === 'number' && Number.isFinite(x));

const isDailyRecord = (v: unknown): v is Record<string, DailyBest> =>
  typeof v === 'object' &&
  v !== null &&
  Object.values(v).every(
    d => typeof d?.score === 'number' && typeof d?.stars === 'number',
  );

/** Stored data may be corrupt or from an old version: fall back to empty. */
export function parseProgress(raw: string | null): Progress {
  if (!raw) {
    return EMPTY_PROGRESS;
  }
  try {
    const v = JSON.parse(raw);
    if (
      Number.isInteger(v?.unlocked) &&
      v.unlocked >= 1 &&
      isNumberRecord(v.stars) &&
      isNumberRecord(v.best)
    ) {
      // `daily` arrived in a later version: older saves simply have none.
      const daily = isDailyRecord(v.daily) ? v.daily : {};
      return { unlocked: v.unlocked, stars: v.stars, best: v.best, daily };
    }
  } catch {}
  return EMPTY_PROGRESS;
}
