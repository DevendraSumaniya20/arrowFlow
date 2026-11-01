import { createHash, randomBytes } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import type { Db } from './db';
import { HttpError } from './errors';

export const newToken = () => randomBytes(32).toString('base64url');

// sha256 is enough here: tokens are 256-bit random values, not passwords.
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function findPlayer(db: Db, req: FastifyRequest) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return null;
  }
  return db.player.findUnique({ where: { tokenHash: hashToken(token) } });
}

export async function requirePlayer(db: Db, req: FastifyRequest) {
  const player = await findPlayer(db, req);
  if (!player) {
    throw new HttpError(401, 'unauthorized', 'Missing or invalid player token');
  }
  return player;
}
