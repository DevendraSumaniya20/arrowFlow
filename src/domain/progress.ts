export interface Progress {
  unlocked: number; // highest playable level
  stars: Record<number, number>;
  best: Record<number, number>; // best score per level
}

export const EMPTY_PROGRESS: Progress = { unlocked: 1, stars: {}, best: {} };

export function applyWin(
  p: Progress,
  level: number,
  stars: number,
  score: number,
): Progress {
  return {
    unlocked: Math.max(p.unlocked, level + 1),
    stars: { ...p.stars, [level]: Math.max(p.stars[level] ?? 0, stars) },
    best: { ...p.best, [level]: Math.max(p.best[level] ?? 0, score) },
  };
}

export const totalStars = (p: Progress) =>
  Object.values(p.stars).reduce((a, b) => a + b, 0);

export const totalScore = (p: Progress) =>
  Object.values(p.best).reduce((a, b) => a + b, 0);

const isNumberRecord = (v: unknown): v is Record<number, number> =>
  typeof v === 'object' &&
  v !== null &&
  Object.values(v).every(x => typeof x === 'number' && Number.isFinite(x));

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
      return { unlocked: v.unlocked, stars: v.stars, best: v.best };
    }
  } catch {}
  return EMPTY_PROGRESS;
}
