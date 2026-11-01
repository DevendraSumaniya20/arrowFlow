export const MAX_LIVES = 3;
export const HINTS_PER_LEVEL = 2;

/** Clean taps in a row earn more: 10, 15, 20, 25, 30 max. */
export const pointsForTap = (streak: number) => 10 + 5 * Math.min(streak - 1, 4);

export const finishBonus = (livesLeft: number) => livesLeft * 25;

export const starsFor = (mistakes: number) => Math.max(1, 3 - mistakes);
