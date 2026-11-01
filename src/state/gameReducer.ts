import { arrowAt, findFreeArrow, scanPath } from '../domain/board';
import {
  finishBonus,
  HINTS_PER_LEVEL,
  MAX_LIVES,
  pointsForTap,
} from '../domain/scoring';
import { Arrow, Level } from '../domain/types';

export type GameStatus = 'playing' | 'won' | 'lost';

export interface Bump {
  id: number;
  cells: number; // free cells before the blocker, drives the bump animation
  nonce: number;
}

export interface GameState {
  level: Level;
  arrows: Arrow[]; // still on the board
  leaving: Arrow[]; // flying off, already out of play
  lives: number;
  mistakes: number;
  streak: number;
  score: number;
  hintsLeft: number;
  hintId: number | null;
  bump: Bump | null;
  status: GameStatus;
  moves: Move[]; // every effective tap/hint, replayed by the server to verify results
}

/** Player inputs that change the game; enough to replay it exactly. */
export type Move = { type: 'tap'; row: number; col: number } | { type: 'hint' };

export type GameAction =
  | { type: 'tap'; row: number; col: number }
  | { type: 'left'; id: number }
  | { type: 'hint' }
  | { type: 'restart' };

export function initGame(level: Level): GameState {
  return {
    level,
    arrows: level.arrows,
    leaving: [],
    lives: MAX_LIVES,
    mistakes: 0,
    streak: 0,
    score: 0,
    hintsLeft: HINTS_PER_LEVEL,
    hintId: null,
    bump: null,
    status: 'playing',
    moves: [],
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'tap': {
      if (state.status !== 'playing') {
        return state;
      }
      const arrow = arrowAt(state.arrows, action.row, action.col);
      if (!arrow) {
        return state;
      }
      const { blockerId, freeCells } = scanPath(
        arrow,
        state.arrows,
        state.level.size,
      );
      if (blockerId === null) {
        const arrows = state.arrows.filter(a => a.id !== arrow.id);
        const streak = state.streak + 1;
        const won = arrows.length === 0;
        return {
          ...state,
          moves: [...state.moves, { type: 'tap', row: action.row, col: action.col }],
          arrows,
          leaving: [...state.leaving, arrow],
          streak,
          score:
            state.score + pointsForTap(streak) + (won ? finishBonus(state.lives) : 0),
          hintId: state.hintId === arrow.id ? null : state.hintId,
          status: won ? 'won' : 'playing',
        };
      }
      const lives = state.lives - 1;
      return {
        ...state,
        moves: [...state.moves, { type: 'tap', row: action.row, col: action.col }],
        lives,
        mistakes: state.mistakes + 1,
        streak: 0,
        bump: { id: arrow.id, cells: freeCells, nonce: (state.bump?.nonce ?? 0) + 1 },
        status: lives <= 0 ? 'lost' : 'playing',
      };
    }
    case 'left':
      return { ...state, leaving: state.leaving.filter(a => a.id !== action.id) };
    case 'hint': {
      if (state.status !== 'playing' || state.hintId !== null || state.hintsLeft <= 0) {
        return state;
      }
      const free = findFreeArrow(state.arrows, state.level.size);
      if (!free) {
        return state;
      }
      return {
        ...state,
        hintId: free.id,
        hintsLeft: state.hintsLeft - 1,
        moves: [...state.moves, { type: 'hint' }],
      };
    }
    case 'restart':
      return initGame(state.level);
  }
}
