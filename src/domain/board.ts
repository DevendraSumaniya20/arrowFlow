import { Arrow, Cell, DELTA } from './types';

export const cellKey = (row: number, col: number) => `${row},${col}`;

export const inBounds = (row: number, col: number, size: number) =>
  row >= 0 && col >= 0 && row < size && col < size;

/** Cells from just in front of the head to the board edge. */
export function pathAhead(arrow: Arrow, size: number): Cell[] {
  const { dr, dc } = DELTA[arrow.dir];
  const path: Cell[] = [];
  let r = arrow.cells[0][0] + dr;
  let c = arrow.cells[0][1] + dc;
  while (inBounds(r, c, size)) {
    path.push([r, c]);
    r += dr;
    c += dc;
  }
  return path;
}

export function buildOccupancy(arrows: Arrow[]): Map<string, number> {
  const occ = new Map<string, number>();
  for (const a of arrows) {
    for (const [r, c] of a.cells) {
      occ.set(cellKey(r, c), a.id);
    }
  }
  return occ;
}

/**
 * Only the head's straight path matters: the body slides along cells the
 * arrow already owns or the head has just cleared.
 * blockerId null means the arrow can leave the board.
 */
export function scanPath(
  arrow: Arrow,
  arrows: Arrow[],
  size: number,
): { blockerId: number | null; freeCells: number } {
  const occ = buildOccupancy(arrows);
  const path = pathAhead(arrow, size);
  for (let i = 0; i < path.length; i++) {
    const id = occ.get(cellKey(path[i][0], path[i][1]));
    if (id !== undefined && id !== arrow.id) {
      return { blockerId: id, freeCells: i };
    }
  }
  return { blockerId: null, freeCells: path.length };
}

export function arrowAt(
  arrows: Arrow[],
  row: number,
  col: number,
): Arrow | undefined {
  return arrows.find(a => a.cells.some(([r, c]) => r === row && c === col));
}

/** Ids of every arrow that can leave right now (one occupancy pass). */
export function freeArrowIds(arrows: Arrow[], size: number): Set<number> {
  const occ = buildOccupancy(arrows);
  const free = new Set<number>();
  for (const a of arrows) {
    const clear = pathAhead(a, size).every(([r, c]) => {
      const id = occ.get(cellKey(r, c));
      return id === undefined || id === a.id;
    });
    if (clear) {
      free.add(a.id);
    }
  }
  return free;
}

export function findFreeArrow(arrows: Arrow[], size: number): Arrow | undefined {
  const free = freeArrowIds(arrows, size);
  return arrows.find(a => free.has(a.id));
}

/**
 * Difficulty measure: rounds needed when every free arrow leaves at once.
 * Infinity means the board can deadlock (never produced by the generator).
 */
export function solveDepth(arrows: Arrow[], size: number): number {
  let left = arrows;
  let rounds = 0;
  while (left.length) {
    const free = freeArrowIds(left, size);
    if (free.size === 0) {
      return Infinity;
    }
    left = left.filter(a => !free.has(a.id));
    rounds++;
  }
  return rounds;
}
