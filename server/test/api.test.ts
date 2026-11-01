import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { generateDailyLevel, generateLevel } from '../src/engine';
import { verify } from '../src/replay';
import { blockedTap, db, makeApp, register, resetDb, solve } from './helpers';

const TODAY = '2026-11-01';

beforeEach(resetDb);
afterAll(() => db.$disconnect());

describe('health', () => {
  it('reports ok when the database answers', async () => {
    const app = await makeApp();
    const res = await app.inject('/health');
    expect(res.json()).toEqual({ ok: true });
  });
});

describe('players', () => {
  it('registers with a nickname and returns a token only once', async () => {
    const app = await makeApp();
    const p = await register(app, '  Dev_01 ');
    expect(p.nickname).toBe('Dev_01');
    expect(p.token).toHaveLength(43);
    const row = await db.player.findUniqueOrThrow({ where: { id: p.id } });
    expect(row.tokenHash).not.toBe(p.token); // only the hash is stored
  });

  it('rejects bad nicknames', async () => {
    const app = await makeApp();
    for (const nickname of ['ab', 'x'.repeat(17), 'bad<script>']) {
      const res = await app.inject({ method: 'POST', url: '/v1/players', payload: { nickname } });
      expect(res.statusCode).toBe(400);
    }
  });

  it('needs a valid token for /me and can rename', async () => {
    const app = await makeApp();
    expect((await app.inject('/v1/players/me')).statusCode).toBe(401);
    expect(
      (await app.inject({ url: '/v1/players/me', headers: { authorization: 'Bearer nope' } }))
        .statusCode,
    ).toBe(401);
    const p = await register(app, 'Alice');
    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/players/me',
      headers: p.auth,
      payload: { nickname: 'Alicia' },
    });
    expect(res.json()).toEqual({ id: p.id, nickname: 'Alicia' });
  });
});

describe('daily challenge', () => {
  const level = generateDailyLevel(TODAY);

  it('serves today in UTC with its difficulty and end time', async () => {
    const app = await makeApp();
    expect((await app.inject('/v1/daily')).json()).toEqual({
      date: TODAY,
      difficulty: 34, // 2026-11-01 is a Sunday
      endsAt: '2026-11-02T00:00:00.000Z',
      now: '2026-11-01T12:00:00.000Z',
    });
  });

  it('scores a verified run on the server and ranks it', async () => {
    const app = await makeApp();
    const p = await register(app, 'Alice');
    const moves = solve(level);
    const res = await app.inject({
      method: 'POST',
      url: `/v1/daily/${TODAY}/results`,
      headers: p.auth,
      payload: { moves, durationMs: 42_000 },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toMatchObject({ ...verify(level, moves), stars: 3, rank: 1 });
  });

  it('rejects runs that do not clear the board, or keep going after the end', async () => {
    const app = await makeApp();
    const p = await register(app, 'Mallory');
    const moves = solve(level);
    for (const bad of [moves.slice(0, -1), [...moves, moves[0]]]) {
      const res = await app.inject({
        method: 'POST',
        url: `/v1/daily/${TODAY}/results`,
        headers: p.auth,
        payload: { moves: bad, durationMs: 60_000 },
      });
      expect(res.statusCode).toBe(422);
      expect(res.json().error).toBe('not_solved');
    }
    const noAuth = await app.inject({
      method: 'POST',
      url: `/v1/daily/${TODAY}/results`,
      payload: { moves, durationMs: 60_000 },
    });
    expect(noAuth.statusCode).toBe(401);
  });

  it('only accepts the open day, with a one hour grace after midnight', async () => {
    const yesterday = '2026-10-31';
    const moves = solve(generateDailyLevel(yesterday));
    const late = await makeApp(new Date('2026-11-01T00:30:00Z'));
    const p = await register(late, 'Owl');
    const ok = await late.inject({
      method: 'POST',
      url: `/v1/daily/${yesterday}/results`,
      headers: p.auth,
      payload: { moves, durationMs: 60_000 },
    });
    expect(ok.statusCode).toBe(200);

    const tooLate = await makeApp(new Date('2026-11-01T02:00:00Z'));
    const res = await tooLate.inject({
      method: 'POST',
      url: `/v1/daily/${yesterday}/results`,
      headers: p.auth,
      payload: { moves, durationMs: 60_000 },
    });
    expect(res.statusCode).toBe(409);
    expect((await tooLate.inject(`/v1/daily/2026-02-30/leaderboard`)).statusCode).toBe(400);
  });

  it('ranks by score then time and keeps each player best run', async () => {
    const app = await makeApp();
    const alice = await register(app, 'Alice');
    const bob = await register(app, 'Bob');
    const clean = solve(level);
    const sloppy = [blockedTap(level), ...clean];
    const submit = (p: typeof alice, moves: typeof clean, durationMs: number) =>
      app.inject({
        method: 'POST',
        url: `/v1/daily/${TODAY}/results`,
        headers: p.auth,
        payload: { moves, durationMs },
      });

    await submit(bob, sloppy, 10_000);
    await submit(alice, clean, 30_000);
    await submit(alice, sloppy, 8_000); // worse score: must not replace the best

    const board = (
      await app.inject({ url: `/v1/daily/${TODAY}/leaderboard`, headers: bob.auth })
    ).json();
    expect(board.entries.map((e: { nickname: string }) => e.nickname)).toEqual(['Alice', 'Bob']);
    expect(board.entries[0]).toMatchObject({ rank: 1, stars: 3, durationMs: 30_000 });
    expect(board.entries[1]).toMatchObject({ rank: 2, stars: 2 });
    expect(board.me).toMatchObject({ nickname: 'Bob', rank: 2 });

    await submit(bob, clean, 20_000); // same score as Alice, faster: takes the lead
    const after = (await app.inject(`/v1/daily/${TODAY}/leaderboard`)).json();
    expect(after.entries[0]).toMatchObject({ nickname: 'Bob', rank: 1 });
    expect(after.me).toBeNull();
  });
});

describe('regressions', () => {
  // Review finding: durationMs is client-reported and broke ties, so 0 won every day.
  it('rejects impossibly fast times', async () => {
    const app = await makeApp();
    const p = await register(app, 'Speedy');
    const moves = solve(generateDailyLevel(TODAY));
    for (const durationMs of [0, moves.length * 100]) {
      const res = await app.inject({
        method: 'POST',
        url: `/v1/daily/${TODAY}/results`,
        headers: p.auth,
        payload: { moves, durationMs },
      });
      expect(res.statusCode).toBe(422);
      expect(res.json().error).toBe('implausible_time');
    }
  });

  it('breaks exact score and time ties by who got there first', async () => {
    const app = await makeApp();
    const first = await register(app, 'First');
    const second = await register(app, 'Second');
    const moves = solve(generateDailyLevel(TODAY));
    for (const p of [first, second]) {
      await app.inject({
        method: 'POST',
        url: `/v1/daily/${TODAY}/results`,
        headers: p.auth,
        payload: { moves, durationMs: 60_000 },
      });
    }
    const board = (await app.inject(`/v1/daily/${TODAY}/leaderboard`)).json();
    expect(board.entries.map((e: { nickname: string; rank: number }) => [e.nickname, e.rank])).toEqual([
      ['First', 1],
      ['Second', 2],
    ]);
  });

  // Review finding: the all-time board loaded every player into memory to slice it.
  it('limits the all-time board in SQL and still ranks me outside the top', async () => {
    const app = await makeApp();
    const alice = await register(app, 'Alice');
    const bob = await register(app, 'Bob');
    for (const [p, levels] of [[alice, [1, 2]], [bob, [1]]] as const) {
      for (const n of levels) {
        await app.inject({
          method: 'POST',
          url: `/v1/levels/${n}/results`,
          headers: p.auth,
          payload: { moves: solve(generateLevel(n)), durationMs: 60_000 },
        });
      }
    }
    const res = (await app.inject({ url: '/v1/leaderboard?limit=1', headers: bob.auth })).json();
    expect(res.entries).toHaveLength(1);
    expect(res.entries[0].nickname).toBe('Alice');
    expect(res.me).toMatchObject({ nickname: 'Bob', rank: 2, levels: 1 });
  });
});

describe('campaign levels and all-time leaderboard', () => {
  it('verifies level runs and sums best scores per player', async () => {
    const app = await makeApp();
    const alice = await register(app, 'Alice');
    const bob = await register(app, 'Bob');
    const play = (p: typeof alice, n: number) =>
      app.inject({
        method: 'POST',
        url: `/v1/levels/${n}/results`,
        headers: p.auth,
        payload: { moves: solve(generateLevel(n)), durationMs: 60_000 },
      });

    expect((await play(alice, 1)).statusCode).toBe(200);
    await play(alice, 2);
    await play(alice, 2); // replaying keeps one row per level
    await play(bob, 1);

    const res = (await app.inject({ url: '/v1/leaderboard', headers: bob.auth })).json();
    expect(res.entries.map((e: { nickname: string; levels: number }) => [e.nickname, e.levels])).toEqual([
      ['Alice', 2],
      ['Bob', 1],
    ]);
    expect(res.me).toMatchObject({ nickname: 'Bob', rank: 2 });

    const wrongLevel = await app.inject({
      method: 'POST',
      url: '/v1/levels/3/results',
      headers: alice.auth,
      payload: { moves: solve(generateLevel(1)), durationMs: 60_000 },
    });
    expect(wrongLevel.statusCode).toBe(422);
  });
});

describe('rate limiting', () => {
  it('limits registrations per IP', async () => {
    const app = await makeApp(undefined, true);
    const codes = [];
    for (let i = 0; i < 11; i++) {
      codes.push((await app.inject({ method: 'POST', url: '/v1/players', payload: { nickname: `p${i}xx` } })).statusCode);
    }
    expect(codes.slice(0, 10).every(c => c === 201)).toBe(true);
    expect(codes[10]).toBe(429);
  });
});
