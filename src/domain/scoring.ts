export const MAX_LIVES = 3;
export const HINTS_PER_LEVEL = 2;
export const UNDOS_PER_LEVEL = 1;
/** Undo gives the heart back but costs points, so a clean run still scores best. */
export const UNDO_COST = 20;

/** Clean taps in a row earn more: 10, 15, 20, 25, 30 max. */
export const pointsForTap = (streak: number) => 10 + 5 * Math.min(streak - 1, 4);

export const finishBonus = (livesLeft: number) => livesLeft * 25;

export const starsFor = (mistakes: number) => Math.max(1, 3 - mistakes);

/** Nobody clears a board faster than this per tap; the server rejects faster runs. */
export const MIN_MS_PER_TAP = 150;
export const MAX_DURATION_MS = 24 * 60 * 60 * 1000;

/** Keeps a measured play time inside what the server accepts, so a clock glitch never costs a result. */
export const clampDuration = (ms: number, taps: number) =>
  Math.min(Math.max(Math.round(ms), taps * MIN_MS_PER_TAP), MAX_DURATION_MS - 1);
