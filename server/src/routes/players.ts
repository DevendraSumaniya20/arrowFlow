import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { newToken, hashToken, requirePlayer } from '../auth';
import type { Db } from '../db';
import { Nickname } from '../schemas';

export function playerRoutes(app: FastifyInstance, db: Db) {
  // Registration hands out the only copy of the token; store it on the device.
  app.post(
    '/v1/players',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const { nickname } = z.object({ nickname: Nickname }).parse(req.body);
      const token = newToken();
      const player = await db.player.create({ data: { nickname, tokenHash: hashToken(token) } });
      return reply.code(201).send({ id: player.id, nickname: player.nickname, token });
    },
  );

  app.get('/v1/players/me', async req => {
    const player = await requirePlayer(db, req);
    return { id: player.id, nickname: player.nickname };
  });

  app.patch('/v1/players/me', async req => {
    const player = await requirePlayer(db, req);
    const { nickname } = z.object({ nickname: Nickname }).parse(req.body);
    const updated = await db.player.update({ where: { id: player.id }, data: { nickname } });
    return { id: updated.id, nickname: updated.nickname };
  });
}
