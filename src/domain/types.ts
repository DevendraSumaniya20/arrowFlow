export type Direction = 'up' | 'down' | 'left' | 'right';

export type Cell = [row: number, col: number];

/**
 * A bent arrow drawn through grid cells. cells[0] is the head; the body
 * trails behind it. When tapped, the head flies straight in `dir` and the
 * body follows its trail like a snake.
 */
export interface Arrow {
  id: number;
  cells: Cell[];
  dir: Direction;
}

export interface Level {
  number: number;
  size: number;
  arrows: Arrow[];
}

export const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];

export const DELTA: Record<Direction, { dr: number; dc: number }> = {
  up: { dr: -1, dc: 0 },
  down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
  right: { dr: 0, dc: 1 },
};
