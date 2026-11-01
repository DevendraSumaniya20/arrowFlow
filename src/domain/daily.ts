import { generateLevel } from './generator';
import { Level } from './types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** UTC calendar date, YYYY-MM-DD. Daily challenges roll over at 00:00 UTC. */
export const utcDate = (now: Date = new Date()) => now.toISOString().slice(0, 10);

export function isValidDate(date: string): boolean {
  return DATE_RE.test(date) && utcDate(new Date(`${date}T00:00:00Z`)) === date;
}

/** Monday plays like level 10, rising to level 34 on Sunday. */
export function dailyDifficulty(date: string): number {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return 10 + ((weekday + 6) % 7) * 4;
}

/* eslint-disable no-bitwise -- hashing */
/** FNV-1a: stable 32-bit hash so every device builds the same daily board. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
/* eslint-enable no-bitwise */

export function generateDailyLevel(date: string): Level {
  return generateLevel(dailyDifficulty(date), hash(`daily:${date}`));
}
