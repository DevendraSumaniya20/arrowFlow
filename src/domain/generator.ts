import { cellKey, freeArrowIds, inBounds, pathAhead, solveDepth } from './board';
import { createRng } from './rng';
import { Arrow, Cell, DELTA, Direction, DIRECTIONS, Level } from './types';

export function levelConfig(n: number) {
  return {
    size: Math.min(6 + Math.floor((n - 1) / 2), 16),
    fill: Math.min(0.8 + n * 0.01, 0.95), // share of cells covered by arrows
    maxLength: Math.min(4 + Math.floor(n / 4), 10),
    candidates: Math.min(4 + n, 16), // boards tried; the hardest one wins
  };
}

export const difficultyOf = (size: number) =>
  size <= 7 ? 'Normal' : size <= 11 ? 'Hard' : 'Expert';

const TURNS: Record<Direction, Direction[]> = {
  up: ['left', 'right'],
  down: ['left', 'right'],
  left: ['up', 'down'],
  right: ['up', 'down'],
};
const CHOICES = 8; // drafts compared per placement

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

/** Deterministic per level: same number, same board on every device. */
export function generateLevel(n: number): Level {
  const { size, fill, maxLength, candidates } = levelConfig(n);
  let best: Level | null = null;
  let bestScore = -1;
  for (let k = 0; k < candidates; k++) {
    const level = buildBoard(n, size, fill, maxLength, createRng(n * 2654435761 + k * 97));
    // Deep chains of dependencies and few free starting moves = hard.
    const score =
      solveDepth(level.arrows, size) * 10 -
      freeArrowIds(level.arrows, size).size * 3 +
      level.arrows.reduce((sum, a) => sum + a.cells.length, 0) / size;
    if (score > bestScore) {
      best = level;
      bestScore = score;
    }
  }
  return best!;
}

/**
 * Places arrows in reverse solve order: each new arrow needs a clear path
 * past the arrows already placed (those leave after it), so every board is
 * solvable and can never deadlock.
 */
function buildBoard(
  n: number,
  size: number,
  fill: number,
  maxLength: number,
  rand: () => number,
): Level {
  const pick = (max: number) => Math.floor(rand() * max);

  const arrows: Arrow[] = [];
  const occupied = new Set<string>();
  // cell -> newest arrow whose exit lane crosses it
  const laneOwner = new Map<string, number>();
  const target = Math.floor(size * size * fill);
  let filled = 0;

  const draftArrow = (): Arrow | null => {
    const head: Cell = [pick(size), pick(size)];
    const dir = DIRECTIONS[pick(4)];
    if (occupied.has(cellKey(head[0], head[1]))) {
      return null;
    }
    const draft: Arrow = { id: arrows.length, cells: [head], dir };
    const ahead = pathAhead(draft, size);
    if (ahead.some(([r, c]) => occupied.has(cellKey(r, c)))) {
      return null;
    }

    // Grow the body backwards from the head; it must avoid its own exit lane.
    const blocked = new Set(ahead.map(([r, c]) => cellKey(r, c)));
    blocked.add(cellKey(head[0], head[1]));
    const free = (r: number, c: number) =>
      inBounds(r, c, size) && !occupied.has(cellKey(r, c)) && !blocked.has(cellKey(r, c));

    const want = 2 + pick(maxLength - 1);
    let heading = OPPOSITE[dir]; // first body cell sits straight behind the head
    let cur = head;
    while (draft.cells.length < want) {
      const turns = rand() < 0.5 ? TURNS[heading] : [...TURNS[heading]].reverse();
      const options =
        draft.cells.length === 1
          ? [heading]
          : rand() < 0.65
          ? [heading, ...turns] // mostly straight runs, like long corridors
          : [...turns, heading];
      const next = options.find(d => free(cur[0] + DELTA[d].dr, cur[1] + DELTA[d].dc));
      if (!next) {
        break;
      }
      heading = next;
      cur = [cur[0] + DELTA[next].dr, cur[1] + DELTA[next].dc];
      blocked.add(cellKey(cur[0], cur[1]));
      draft.cells.push(cur);
    }
    return draft.cells.length >= 2 ? draft : null;
  };

  // Blocking the newest arrows' lanes stacks dependencies into long chains.
  const chainScore = (a: Arrow) =>
    Math.max(-1, ...a.cells.map(([r, c]) => laneOwner.get(cellKey(r, c)) ?? -1)) + rand();

  for (let tries = 0; tries < size * size * 30 && filled < target; ) {
    let best: Arrow | null = null;
    for (let k = 0; k < CHOICES && tries < size * size * 30; tries++) {
      const draft = draftArrow();
      if (draft) {
        k++;
        if (!best || chainScore(draft) > chainScore(best)) {
          best = draft;
        }
      }
    }
    if (!best) {
      break;
    }
    best.cells.forEach(([r, c]) => occupied.add(cellKey(r, c)));
    pathAhead(best, size).forEach(([r, c]) => laneOwner.set(cellKey(r, c), arrows.length));
    arrows.push(best);
    filled += best.cells.length;
  }

  return { number: n, size, arrows };
}
