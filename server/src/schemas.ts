import { z } from 'zod';

export const Nickname = z
  .string()
  .trim()
  .min(3, 'Nickname needs at least 3 characters')
  .max(16, 'Nickname can have at most 16 characters')
  .regex(/^[\p{L}\p{N}_ .-]+$/u, 'Use letters, numbers, spaces, _ . or -');

const Coord = z.number().int().min(0).max(63);

export const Moves = z
  .array(
    z.discriminatedUnion('type', [
      z.object({ type: z.literal('tap'), row: Coord, col: Coord }),
      z.object({ type: z.literal('hint') }),
    ]),
  )
  .min(1)
  .max(2000);

export const ResultBody = z.object({
  moves: Moves,
  durationMs: z.number().int().min(0).max(24 * 60 * 60 * 1000),
});

export const Limit = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
