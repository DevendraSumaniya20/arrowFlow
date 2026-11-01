import { buildApp } from '../src/app';
import { createDb } from '../src/db';
import type { Level, Move } from '../src/engine';
import { freeArrowIds } from '../../src/domain/board';

export const db = createDb(process.env.TEST_DATABASE_URL!);

export async function resetDb() {
  await db.$executeRaw`TRUNCATE players, daily_results, level_results CASCADE`;
}

export function makeApp(now = new Date('2026-11-01T12:00:00Z'), rateLimit = false) {
  return buildApp({ db, now: () => now, rateLimit });
}

/** A perfect playthrough: always tap a free arrow's head. */
export function solve(level: Level): Move[] {
  let left = level.arrows;
  const moves: Move[] = [];
  while (left.length) {
    const free = freeArrowIds(left, level.size);
    const next = left.find(a => free.has(a.id))!;
    moves.push({ type: 'tap', row: next.cells[0][0], col: next.cells[0][1] });
    left = left.filter(a => a.id !== next.id);
  }
  return moves;
}

/** Tap on an arrow that is blocked at the start: costs one life. */
export function blockedTap(level: Level): Move {
  const free = freeArrowIds(level.arrows, level.size);
  const blocked = level.arrows.find(a => !free.has(a.id))!;
  return { type: 'tap', row: blocked.cells[0][0], col: blocked.cells[0][1] };
}

export async function register(app: Awaited<ReturnType<typeof makeApp>>, nickname: string) {
  const res = await app.inject({ method: 'POST', url: '/v1/players', payload: { nickname } });
  const body = res.json();
  return { ...body, auth: { authorization: `Bearer ${body.token}` } } as {
    id: string;
    nickname: string;
    token: string;
    auth: { authorization: string };
  };
}
