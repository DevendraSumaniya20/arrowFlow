import { Prisma } from '../generated/prisma/client.ts';
import type { Db } from './db';

/*
 * One ranked query per board; the top list and "my rank" both read from it,
 * so the two can never disagree. Ties: score, then time, then whoever got
 * there first (updated_at is when the current best was set).
 */

interface DailyRow {
  rank: bigint;
  player_id: string;
  nickname: string;
  score: number;
  stars: number;
  duration_ms: number;
}

const dailyRanked = (date: string) => Prisma.sql`
  SELECT RANK() OVER (ORDER BY d.score DESC, d.duration_ms ASC, d.updated_at ASC) AS rank,
         d.player_id, p.nickname, d.score, d.stars, d.duration_ms
  FROM daily_results d JOIN players p ON p.id = d.player_id
  WHERE d.date = ${date}`;

const dailyEntry = (r: DailyRow) => ({
  rank: Number(r.rank),
  playerId: r.player_id,
  nickname: r.nickname,
  score: r.score,
  stars: r.stars,
  durationMs: r.duration_ms,
});

export async function dailyTop(db: Db, date: string, limit: number) {
  const rows = await db.$queryRaw<DailyRow[]>`
    SELECT * FROM (${dailyRanked(date)}) r ORDER BY rank LIMIT ${limit}`;
  return rows.map(dailyEntry);
}

export async function dailyRank(db: Db, date: string, playerId: string) {
  const rows = await db.$queryRaw<DailyRow[]>`
    SELECT * FROM (${dailyRanked(date)}) r WHERE player_id = ${playerId}::uuid`;
  return rows[0] ? dailyEntry(rows[0]) : null;
}

interface GlobalRow {
  rank: bigint;
  player_id: string;
  nickname: string;
  score: bigint;
  stars: bigint;
  levels: bigint;
}

// shortcut: aggregates level_results on each request; fine for thousands of
// players, move to a materialized view when it gets slow.
const globalRanked = Prisma.sql`
  SELECT RANK() OVER (ORDER BY SUM(l.score) DESC, COUNT(*) DESC, MAX(l.updated_at) ASC) AS rank,
         l.player_id, p.nickname, SUM(l.score) AS score, SUM(l.stars) AS stars, COUNT(*) AS levels
  FROM level_results l JOIN players p ON p.id = l.player_id
  GROUP BY l.player_id, p.nickname`;

const globalEntry = (r: GlobalRow) => ({
  rank: Number(r.rank),
  playerId: r.player_id,
  nickname: r.nickname,
  score: Number(r.score),
  stars: Number(r.stars),
  levels: Number(r.levels),
});

export async function globalTop(db: Db, limit: number) {
  const rows = await db.$queryRaw<GlobalRow[]>`
    SELECT * FROM (${globalRanked}) r ORDER BY rank LIMIT ${limit}`;
  return rows.map(globalEntry);
}

export async function globalRank(db: Db, playerId: string) {
  const rows = await db.$queryRaw<GlobalRow[]>`
    SELECT * FROM (${globalRanked}) r WHERE player_id = ${playerId}::uuid`;
  return rows[0] ? globalEntry(rows[0]) : null;
}
