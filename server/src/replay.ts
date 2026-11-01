import { gameReducer, initGame, Level, Move, starsFor } from './engine';

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
