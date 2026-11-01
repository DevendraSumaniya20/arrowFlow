import { freeArrowIds, pathAhead, solveDepth } from '../board';
import { generateLevel, levelConfig } from '../generator';
import { createRng } from '../rng';
import { HINTS_PER_LEVEL, pointsForTap, starsFor } from '../scoring';
import { gameReducer, initGame } from '../../state/gameReducer';
import { Arrow, Level } from '../types';

// 4x4 chain: C blocks B, B blocks A. Solve order C, B, A.
const A: Arrow = { id: 0, cells: [[0, 1], [0, 0]], dir: 'right' }; // lane hits B at (0,2)
const B: Arrow = { id: 1, cells: [[1, 2], [0, 2]], dir: 'down' }; // lane (2,2),(3,2)
const C: Arrow = { id: 2, cells: [[3, 2], [3, 3]], dir: 'left' }; // lane (3,1),(3,0)
const chain: Level = { number: 1, size: 4, arrows: [A, B, C] };

describe('board rules', () => {
  it('pathAhead runs from the head to the edge', () => {
    expect(pathAhead(A, 4)).toEqual([
      [0, 2],
      [0, 3],
    ]);
  });

  it('finds only unblocked arrows', () => {
    expect([...freeArrowIds(chain.arrows, 4)]).toEqual([2]);
  });

  it('measures solve depth as removal rounds', () => {
    expect(solveDepth(chain.arrows, 4)).toBe(3);
  });

  it('reports deadlocks as Infinity', () => {
    const x: Arrow = { id: 0, cells: [[0, 0], [1, 0]], dir: 'right' }; // lane hits y
    const y: Arrow = { id: 1, cells: [[0, 1], [1, 1]], dir: 'left' }; // lane hits x
    expect(solveDepth([x, y], 2)).toBe(Infinity);
  });
});

describe('generator difficulty', () => {
  it('rng is deterministic', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('grows boards and chains as levels go up', () => {
    expect(levelConfig(30).size).toBeGreaterThan(levelConfig(1).size);
    const avgDepth = (from: number) => {
      let sum = 0;
      for (let n = from; n < from + 5; n++) {
        const l = generateLevel(n);
        sum += solveDepth(l.arrows, l.size);
      }
      return sum / 5;
    };
    expect(avgDepth(30)).toBeGreaterThan(avgDepth(1));
  });

  it('never starts with every arrow free, so order matters', () => {
    for (let n = 1; n <= 50; n++) {
      const l = generateLevel(n);
      expect(freeArrowIds(l.arrows, l.size).size).toBeLessThan(l.arrows.length);
      expect(solveDepth(l.arrows, l.size)).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('scoring', () => {
  it('rewards combos up to a cap', () => {
    expect([1, 2, 3, 5, 9].map(pointsForTap)).toEqual([10, 15, 20, 30, 30]);
  });

  it('turns mistakes into stars, never below one', () => {
    expect([0, 1, 2, 5].map(starsFor)).toEqual([3, 2, 1, 1]);
  });
});

describe('gameReducer extras', () => {
  it('resets the combo on a mistake', () => {
    let s = initGame(chain);
    s = gameReducer(s, { type: 'tap', row: 3, col: 2 }); // C free
    s = gameReducer(s, { type: 'tap', row: 0, col: 1 }); // A blocked by B
    expect(s.streak).toBe(0);
    expect(s.lives).toBe(2);
    expect(s.bump).toMatchObject({ id: 0, cells: 0 });
  });

  it('hints point at a free arrow and run out', () => {
    let s = initGame(chain);
    s = gameReducer(s, { type: 'hint' });
    expect(s.hintId).toBe(2);
    expect(s.hintsLeft).toBe(HINTS_PER_LEVEL - 1);
    // A second hint while one is showing is ignored.
    expect(gameReducer(s, { type: 'hint' })).toBe(s);
    // Taking the hinted arrow clears it; next hint finds the next free arrow.
    s = gameReducer(s, { type: 'tap', row: 3, col: 3 });
    expect(s.hintId).toBeNull();
    s = gameReducer(s, { type: 'hint' });
    expect(s.hintId).toBe(1);
    expect(s.hintsLeft).toBe(0);
    s = gameReducer(s, { type: 'tap', row: 1, col: 2 });
    expect(gameReducer(s, { type: 'hint' })).toBe(s);
  });

  it('drops a leaving arrow once its animation ends', () => {
    let s = initGame(chain);
    s = gameReducer(s, { type: 'tap', row: 3, col: 2 });
    expect(s.leaving.map(a => a.id)).toEqual([2]);
    s = gameReducer(s, { type: 'left', id: 2 });
    expect(s.leaving).toEqual([]);
  });

  it('ignores taps after the game ends and restarts cleanly', () => {
    let s = initGame(chain);
    for (let i = 0; i < 3; i++) {
      s = gameReducer(s, { type: 'tap', row: 0, col: 0 });
    }
    expect(s.status).toBe('lost');
    expect(gameReducer(s, { type: 'tap', row: 3, col: 2 })).toBe(s);
    expect(gameReducer(s, { type: 'restart' })).toEqual(initGame(chain));
  });
});
