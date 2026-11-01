import { gameReducer, initGame, Level, MIN_MS_PER_TAP, Move, starsFor } from './engine';
import { HttpError } from './errors';

export interface Verified {
  score: number;
  stars: number;
  mistakes: number;
}

/**
 * Replays the moves on the real board. Returns the server-computed result,
 * or null if the moves do not clear the board. Clients never send a score.
 */
export function verify(level: Level, moves: Move[]): Verified | null {
  let state = initGame(level);
  for (const move of moves) {
    if (state.status !== 'playing') {
      return null; // moves after the game ended: not a real playthrough
    }
    state = gameReducer(state, move);
  }
  if (state.status !== 'won') {
    return null;
  }
  return { score: state.score, stars: starsFor(state.mistakes), mistakes: state.mistakes };
}

/** Verifies a submitted run or throws the HTTP error the client should see. */
export function verifyRun(level: Level, moves: Move[], durationMs: number): Verified {
  // Times are client-reported and break score ties, so "durationMs: 0" must not win.
  const taps = moves.filter(m => m.type === 'tap').length;
  if (durationMs < taps * MIN_MS_PER_TAP) {
    throw new HttpError(422, 'implausible_time', 'Reported time is faster than possible');
  }
  const result = verify(level, moves);
  if (!result) {
    throw new HttpError(422, 'not_solved', 'Moves do not clear the board');
  }
  return result;
}
