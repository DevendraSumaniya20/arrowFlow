import { Arrow, Level } from '../../domain/types';
import { UNDO_COST } from '../../domain/scoring';
import { canUndo, gameReducer, initGame, usedUndos } from '../gameReducer';

// A blocks on B; C is free.
const level: Level = {
  number: 1,
  size: 4,
  arrows: [
    { id: 0, cells: [[0, 1], [0, 0]], dir: 'right' },
    { id: 1, cells: [[1, 3], [0, 3]], dir: 'down' },
    { id: 2, cells: [[3, 0], [3, 1]], dir: 'left' },
  ] as Arrow[],
};
const blocked = { type: 'tap' as const, row: 0, col: 0 };
const free = { type: 'tap' as const, row: 3, col: 0 };

describe('undo', () => {
  it('gives back the heart and the combo for points, once per level', () => {
    let s = initGame(level);
    s = gameReducer(s, free); // streak 1, +10
    s = gameReducer(s, blocked);
    expect(s).toMatchObject({ lives: 2, mistakes: 1, streak: 0 });
    expect(canUndo(s)).toBe(true);

    s = gameReducer(s, { type: 'undo' });
    expect(s).toMatchObject({ lives: 3, mistakes: 0, streak: 1, undosLeft: 0, score: 10 - UNDO_COST });
    expect(usedUndos(s)).toBe(1);

    s = gameReducer(s, blocked);
    expect(canUndo(s)).toBe(false); // none left
    expect(gameReducer(s, { type: 'undo' })).toBe(s);
  });

  // Found by the server test: the cost used to clamp at 0, so an undo before scoring was free.
  it('always costs points, even before any were earned', () => {
    let s = gameReducer(initGame(level), blocked);
    s = gameReducer(s, { type: 'undo' });
    expect(s.score).toBe(-UNDO_COST);
    for (const m of [free, { type: 'tap' as const, row: 1, col: 3 }, blocked]) {
      s = gameReducer(s, m);
    }
    const clean = [free, { type: 'tap' as const, row: 1, col: 3 }, blocked].reduce(gameReducer, initGame(level));
    expect(s.status).toBe('won');
    expect(s.score).toBe(clean.score - UNDO_COST);
  });

  it('only applies right after a mistake', () => {
    let s = gameReducer(initGame(level), blocked);
    s = gameReducer(s, free); // another move in between
    expect(canUndo(s)).toBe(false);
    expect(gameReducer(initGame(level), { type: 'undo' }).moves).toEqual([]);
  });

  it('can revive a run lost on its last heart', () => {
    let s = initGame(level);
    for (let i = 0; i < 3; i++) {
      s = gameReducer(s, blocked);
    }
    expect(s.status).toBe('lost');
    s = gameReducer(s, { type: 'undo' });
    expect(s).toMatchObject({ status: 'playing', lives: 1 });
  });

  it('replays identically from the move log (server verification)', () => {
    let s = initGame(level);
    for (const m of [free, blocked, { type: 'undo' as const }, { type: 'tap' as const, row: 1, col: 3 }, blocked]) {
      s = gameReducer(s, m);
    }
    const replayed = s.moves.reduce(gameReducer, initGame(level));
    expect(replayed.status).toBe('won');
    expect(replayed.score).toBe(s.score);
    expect(replayed.mistakes).toBe(0);
  });
});
