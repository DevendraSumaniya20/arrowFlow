import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { findPlayer, requirePlayer } from '../auth';
import type { Db } from '../db';
import { generateLevel } from '../engine';
import { globalRank, globalTop } from '../ranking';
import { verifyRun } from '../replay';
import { Limit, ResultBody } from '../schemas';

const LevelParam = z.object({ level: z.coerce.number().int().min(1).max(100_000) });

export function levelRoutes(app: FastifyInstance, db: Db) {
  app.post(
    '/v1/levels/:level/results',
    { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } },
    async req => {
      const player = await requirePlayer(db, req);
      const { level } = LevelParam.parse(req.params);
      const { moves, durationMs } = ResultBody.parse(req.body);
      const result = verifyRun(generateLevel(level), moves, durationMs);
      await db.$executeRaw`
        INSERT INTO level_results (player_id, level, score, stars, mistakes, duration_ms, moves, updated_at)
        VALUES (${player.id}::uuid, ${level}, ${result.score}, ${result.stars}, ${result.mistakes},
                ${durationMs}, ${JSON.stringify(moves)}::jsonb, now())
        ON CONFLICT (player_id, level) DO UPDATE SET
          score = EXCLUDED.score, stars = EXCLUDED.stars, mistakes = EXCLUDED.mistakes,
          duration_ms = EXCLUDED.duration_ms, moves = EXCLUDED.moves, updated_at = now()
        WHERE EXCLUDED.score > level_results.score
           OR (EXCLUDED.score = level_results.score AND EXCLUDED.duration_ms < level_results.duration_ms)`;
      return result;
    },
  );

  app.get('/v1/leaderboard', async req => {
    const { limit } = Limit.parse(req.query);
    const player = await findPlayer(db, req);
    return {
      entries: await globalTop(db, limit),
      me: player ? await globalRank(db, player.id) : null,
    };
  });
}
