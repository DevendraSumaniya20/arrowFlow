import { Arrow, Level } from '../../domain/types';
import { feedbackFor } from '../feedback';
import { gameReducer, GameAction, GameState, initGame } from '../gameReducer';

const level: Level = {
  number: 1,
  size: 4,
  arrows: [
    { id: 0, cells: [[0, 1], [0, 0]], dir: 'right' }, // blocked by 1
    { id: 1, cells: [[1, 3], [0, 3]], dir: 'down' },
  ] as Arrow[],
};

const step = (s: GameState, a: GameAction) => {
  const next = gameReducer(s, a);
  return { next, events: feedbackFor(s, next) };
};

describe('feedbackFor', () => {
  it('slides on a clean tap and bumps on a blocked one', () => {
    const s = initGame(level);
    expect(step(s, { type: 'tap', row: 0, col: 3 }).events).toEqual(['slide']);
    expect(step(s, { type: 'tap', row: 0, col: 0 }).events).toEqual(['bump']);
  });

  it('chimes on hint and on win', () => {
    let s = initGame(level);
    expect(step(s, { type: 'hint' }).events).toEqual(['hint']);
    s = gameReducer(s, { type: 'tap', row: 0, col: 3 });
    expect(step(s, { type: 'tap', row: 0, col: 0 }).events).toEqual(['slide', 'win']);
  });

  it('plays lose on the last life and stays silent on restart or no-ops', () => {
    let s = initGame(level);
    s = gameReducer(s, { type: 'tap', row: 0, col: 0 });
    s = gameReducer(s, { type: 'tap', row: 0, col: 0 });
    expect(step(s, { type: 'tap', row: 0, col: 0 }).events).toEqual(['bump', 'lose']);
    s = gameReducer(s, { type: 'tap', row: 0, col: 3 });
    expect(step(s, { type: 'restart' }).events).toEqual([]);
    expect(step(s, { type: 'tap', row: 3, col: 0 }).events).toEqual([]);
  });
});
