import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { findPlayer, requirePlayer } from '../auth';
import type { Db } from '../db';
import { generateLevel } from '../engine';
import { HttpError } from '../errors';
import { verify } from '../replay';
import { Limit, ResultBody } from '../schemas';

const LevelParam = z.object({ level: z.coerce.number().int().min(1).max(100_000) });

interface Row {
  rank: bigint;
  player_id: string;
  nickname: string;
  score: bigint;
  stars: bigint;
  levels: bigint;
}

const toEntry = (r: Row) => ({
  rank: Number(r.rank),
  playerId: r.player_id,
  nickname: r.nickname,
  score: Number(r.score),
  stars: Number(r.stars),
  levels: Number(r.levels),
});

// shortcut: all-time ranks are computed with SUM() on every request; fine for
// thousands of players, move to a materialized view when it gets slow.
const RANKED = (db: Db) => db.$queryRaw<Row[]>`
  SELECT RANK() OVER (ORDER BY SUM(l.score) DESC, COUNT(*) DESC) AS rank,
         l.player_id, p.nickname, SUM(l.score) AS score, SUM(l.stars) AS stars, COUNT(*) AS levels
  FROM level_results l JOIN players p ON p.id = l.player_id
  GROUP BY l.player_id, p.nickname
  ORDER BY rank, p.nickname`;

export function levelRoutes(app: FastifyInstance, db: Db) {
  app.post(
    '/v1/levels/:level/results',
    { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } },
    async req => {
      const player = await requirePlayer(db, req);
      const { level } = LevelParam.parse(req.params);
      const { moves, durationMs } = ResultBody.parse(req.body);
      const result = verify(generateLevel(level), moves);
      if (!result) {
        throw new HttpError(422, 'not_solved', 'Moves do not clear the board');
      }
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
    const all = (await RANKED(db)).map(toEntry);
    const player = await findPlayer(db, req);
    return {
      entries: all.slice(0, limit),
      me: (player && all.find(e => e.playerId === player.id)) ?? null,
    };
  });
}
