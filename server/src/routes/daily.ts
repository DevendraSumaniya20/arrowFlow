import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { findPlayer, requirePlayer } from '../auth';
import type { Db } from '../db';
import { dailyDifficulty, generateDailyLevel, isValidDate, utcDate } from '../engine';
import { HttpError } from '../errors';
import { dailyRank, dailyTop } from '../ranking';
import { verifyRun } from '../replay';
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

export function dailyRoutes(app: FastifyInstance, db: Db, now: () => Date) {
  app.get('/v1/daily', async () => {
    const date = utcDate(now());
    const tomorrow = new Date(`${date}T00:00:00Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    // `now` lets clients correct a wrong device clock.
    return {
      date,
      difficulty: dailyDifficulty(date),
      endsAt: tomorrow.toISOString(),
      now: now().toISOString(),
    };
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
      const result = verifyRun(generateDailyLevel(date), moves, durationMs);

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
    const player = await findPlayer(db, req);
    return {
      date,
      entries: await dailyTop(db, date, limit),
      me: player ? await dailyRank(db, date, player.id) : null,
    };
  });
}
