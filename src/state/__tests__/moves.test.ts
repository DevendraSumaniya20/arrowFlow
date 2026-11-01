import { generateLevel } from '../../domain/generator';
import { freeArrowIds } from '../../domain/board';
import { gameReducer, GameState, initGame } from '../gameReducer';

describe('move log', () => {
  const level = generateLevel(3);

  it('records only taps and hints that change the game', () => {
    let s = initGame(level);
    s = gameReducer(s, { type: 'tap', row: -1, col: -1 }); // off the board
    s = gameReducer(s, { type: 'hint' });
    s = gameReducer(s, { type: 'hint' }); // ignored: a hint is already showing
    expect(s.moves).toEqual([{ type: 'hint' }]);
    s = gameReducer(s, { type: 'restart' });
    expect(s.moves).toEqual([]);
  });

  it('replays to the same result, which is what the server relies on', () => {
    let s: GameState = initGame(level);
    const blocked = level.arrows.find(a => !freeArrowIds(level.arrows, level.size).has(a.id))!;
    s = gameReducer(s, { type: 'tap', row: blocked.cells[0][0], col: blocked.cells[0][1] });
    while (s.status === 'playing') {
      const free = freeArrowIds(s.arrows, level.size);
      const next = s.arrows.find(a => free.has(a.id))!;
      s = gameReducer(s, { type: 'tap', row: next.cells[0][0], col: next.cells[0][1] });
    }
    const replayed = s.moves.reduce(gameReducer, initGame(level));
    expect(replayed.status).toBe('won');
    expect(replayed.score).toBe(s.score);
    expect(replayed.mistakes).toBe(1);
  });
});
