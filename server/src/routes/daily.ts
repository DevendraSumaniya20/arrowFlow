import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { findPlayer, requirePlayer } from '../auth';
import type { Db } from '../db';
import { dailyDifficulty, generateDailyLevel, isValidDate, utcDate } from '../engine';
import { HttpError } from '../errors';
import { verify } from '../replay';
import { Limit, ResultBody } from '../schemas';

const GRACE_MS = 60 * 60 * 1000; // yesterday's puzzle still accepts results for 1h

const DateParam = z.object({
  date: z.string().refine(isValidDate, 'Expected a date like 2026-11-01'),
});

/** Today, plus yesterday during the grace hour after midnight UTC. */
export function openDates(now: Date): string[] {
  return [utcDate(now), utcDate(new Date(now.getTime() - GRACE_MS))].filter(
    (d, i, all) => all.indexOf(d) === i,
  );
}

interface Row {
  rank: bigint;
  player_id: string;
  nickname: string;
  score: number;
  stars: number;
  duration_ms: number;
}

const toEntry = (r: Row) => ({
  rank: Number(r.rank),
  playerId: r.player_id,
  nickname: r.nickname,
  score: r.score,
  stars: r.stars,
  durationMs: r.duration_ms,
});

export function dailyRoutes(app: FastifyInstance, db: Db, now: () => Date) {
  app.get('/v1/daily', async () => {
    const date = utcDate(now());
    const tomorrow = new Date(`${date}T00:00:00Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    return { date, difficulty: dailyDifficulty(date), endsAt: tomorrow.toISOString() };
  });

  app.post(
    '/v1/daily/:date/results',
    { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
    async req => {
      const player = await requirePlayer(db, req);
      const { date } = DateParam.parse(req.params);
      const { moves, durationMs } = ResultBody.parse(req.body);
      if (!openDates(now()).includes(date)) {
        throw new HttpError(409, 'daily_closed', 'This daily challenge is not open');
      }
      const result = verify(generateDailyLevel(date), moves);
      if (!result) {
        throw new HttpError(422, 'not_solved', 'Moves do not clear the board');
      }

      // Keep the best run: higher score wins, then the faster time.
      await db.$executeRaw`
        INSERT INTO daily_results (player_id, date, score, stars, mistakes, duration_ms, moves, updated_at)
        VALUES (${player.id}::uuid, ${date}, ${result.score}, ${result.stars}, ${result.mistakes},
                ${durationMs}, ${JSON.stringify(moves)}::jsonb, now())
        ON CONFLICT (player_id, date) DO UPDATE SET
          score = EXCLUDED.score, stars = EXCLUDED.stars, mistakes = EXCLUDED.mistakes,
          duration_ms = EXCLUDED.duration_ms, moves = EXCLUDED.moves, updated_at = now()
        WHERE EXCLUDED.score > daily_results.score
           OR (EXCLUDED.score = daily_results.score AND EXCLUDED.duration_ms < daily_results.duration_ms)`;

      const me = await dailyRank(db, date, player.id);
      return { ...result, best: me && { score: me.score, stars: me.stars }, rank: me?.rank ?? null };
    },
  );

  app.get('/v1/daily/:date/leaderboard', async req => {
    const { date } = DateParam.parse(req.params);
    const { limit } = Limit.parse(req.query);
    const rows = await db.$queryRaw<Row[]>`
      SELECT RANK() OVER (ORDER BY d.score DESC, d.duration_ms ASC) AS rank,
             d.player_id, p.nickname, d.score, d.stars, d.duration_ms
      FROM daily_results d JOIN players p ON p.id = d.player_id
      WHERE d.date = ${date}
      ORDER BY rank, d.updated_at
      LIMIT ${limit}`;
    const player = await findPlayer(db, req);
    return {
      date,
      entries: rows.map(toEntry),
      me: player ? await dailyRank(db, date, player.id) : null,
    };
  });
}

async function dailyRank(db: Db, date: string, playerId: string) {
  const rows = await db.$queryRaw<Row[]>`
    SELECT * FROM (
      SELECT RANK() OVER (ORDER BY d.score DESC, d.duration_ms ASC) AS rank,
             d.player_id, p.nickname, d.score, d.stars, d.duration_ms
      FROM daily_results d JOIN players p ON p.id = d.player_id
      WHERE d.date = ${date}
    ) ranked WHERE player_id = ${playerId}::uuid`;
  return rows[0] ? toEntry(rows[0]) : null;
}
