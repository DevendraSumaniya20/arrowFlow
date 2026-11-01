import { cellKey, findFreeArrow, inBounds, pathAhead, scanPath } from '../board';
import { generateLevel } from '../generator';
import { applyWin, EMPTY_PROGRESS, parseProgress } from '../progress';
import { gameReducer, initGame } from '../../state/gameReducer';
import { Arrow } from '../types';

describe('generateLevel', () => {
  it('is deterministic per level', () => {
    expect(generateLevel(7)).toEqual(generateLevel(7));
    expect(generateLevel(7)).not.toEqual(generateLevel(8));
  });

  it('builds valid, always-solvable boards for levels 1..120', () => {
    for (let n = 1; n <= 120; n++) {
      const level = generateLevel(n);
      expect(level.arrows.length).toBeGreaterThan(0);

      const seen = new Set<string>();
      for (const a of level.arrows) {
        expect(a.cells.length).toBeGreaterThanOrEqual(2);
        // Body is a connected path and never sits in its own exit lane.
        for (let i = 1; i < a.cells.length; i++) {
          const [r0, c0] = a.cells[i - 1];
          const [r1, c1] = a.cells[i];
          expect(Math.abs(r0 - r1) + Math.abs(c0 - c1)).toBe(1);
        }
        const lane = new Set(pathAhead(a, level.size).map(([r, c]) => cellKey(r, c)));
        for (const [r, c] of a.cells) {
          expect(lane.has(cellKey(r, c))).toBe(false);
        }
        for (const [r, c] of a.cells) {
          expect(inBounds(r, c, level.size)).toBe(true);
          expect(seen.has(cellKey(r, c))).toBe(false);
          seen.add(cellKey(r, c));
        }
      }

      // Removing an arrow never blocks another, so greedy solving must clear the board.
      let left = level.arrows;
      while (left.length) {
        const free = findFreeArrow(left, level.size);
        expect(free).toBeDefined();
        left = left.filter(a => a.id !== free!.id);
      }
    }
  });
});

describe('scanPath', () => {
  const a: Arrow = { id: 0, cells: [[0, 1], [0, 0]], dir: 'right' };
  const b: Arrow = { id: 1, cells: [[1, 3], [0, 3]], dir: 'down' };

  it('reports the blocker and free cells before it', () => {
    expect(scanPath(a, [a, b], 4)).toEqual({ blockerId: 1, freeCells: 1 });
  });

  it('is clear once the blocker is gone', () => {
    expect(scanPath(a, [a], 4).blockerId).toBeNull();
  });
});

describe('gameReducer', () => {
  const level = {
    number: 1,
    size: 4,
    arrows: [
      { id: 0, cells: [[0, 1], [0, 0]], dir: 'right' },
      { id: 1, cells: [[1, 3], [0, 3]], dir: 'down' },
    ] as Arrow[],
  };

  it('costs a life on a blocked tap and loses at zero', () => {
    let s = initGame(level);
    for (let i = 0; i < 3; i++) {
      s = gameReducer(s, { type: 'tap', row: 0, col: 0 });
    }
    expect(s.lives).toBe(0);
    expect(s.status).toBe('lost');
    expect(s.arrows).toHaveLength(2);
  });

  it('wins after clearing in a valid order with score and bonus', () => {
    let s = initGame(level);
    s = gameReducer(s, { type: 'tap', row: 0, col: 3 });
    s = gameReducer(s, { type: 'tap', row: 0, col: 0 });
    expect(s.status).toBe('won');
    expect(s.score).toBe(10 + 15 + 3 * 25);
    expect(s.leaving).toHaveLength(2);
  });

  it('ignores taps on empty cells', () => {
    const s = initGame(level);
    expect(gameReducer(s, { type: 'tap', row: 3, col: 3 })).toBe(s);
  });
});

describe('progress', () => {
  it('keeps best results and unlocks the next level', () => {
    let p = applyWin(EMPTY_PROGRESS, 1, 3, 120);
    p = applyWin(p, 1, 1, 50);
    expect(p).toEqual({ unlocked: 2, stars: { 1: 3 }, best: { 1: 120 } });
  });

  it('falls back to empty on corrupt storage', () => {
    expect(parseProgress('{bad json')).toBe(EMPTY_PROGRESS);
    expect(parseProgress('{"unlocked":0,"stars":{},"best":{}}')).toBe(EMPTY_PROGRESS);
    expect(parseProgress(JSON.stringify(applyWin(EMPTY_PROGRESS, 4, 2, 80)))).toEqual({
      unlocked: 5,
      stars: { 4: 2 },
      best: { 4: 80 },
    });
  });
});
