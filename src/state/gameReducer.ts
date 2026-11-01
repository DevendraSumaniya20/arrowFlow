import { arrowAt, findFreeArrow, scanPath } from '../domain/board';
import {
  finishBonus,
  HINTS_PER_LEVEL,
  MAX_LIVES,
  pointsForTap,
  UNDO_COST,
  UNDOS_PER_LEVEL,
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
  bestStreak: number;
  score: number;
  hintsLeft: number;
  hintId: number | null;
  undosLeft: number;
  /** Set right after a blocked tap: what undo restores. Cleared by any other move. */
  lastMistake: { streak: number } | null;
  bump: Bump | null;
  status: GameStatus;
  moves: Move[]; // every effective input, replayed by the server to verify results
}

/** Player inputs that change the game; enough to replay it exactly. */
export type Move = { type: 'tap'; row: number; col: number } | { type: 'hint' } | { type: 'undo' };

export type GameAction =
  | { type: 'tap'; row: number; col: number }
  | { type: 'left'; id: number }
  | { type: 'hint' }
  | { type: 'undo' }
  | { type: 'restart' };

export function initGame(level: Level): GameState {
  return {
    level,
    arrows: level.arrows,
    leaving: [],
    lives: MAX_LIVES,
    mistakes: 0,
    streak: 0,
    bestStreak: 0,
    score: 0,
    hintsLeft: HINTS_PER_LEVEL,
    hintId: null,
    undosLeft: UNDOS_PER_LEVEL,
    lastMistake: null,
    bump: null,
    status: 'playing',
    moves: [],
  };
}

export const canUndo = (s: GameState) =>
  s.undosLeft > 0 && s.lastMistake !== null && s.status !== 'won';

export const usedHints = (s: GameState) => s.moves.filter(m => m.type === 'hint').length;
export const usedUndos = (s: GameState) => s.moves.filter(m => m.type === 'undo').length;

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
      const moves: Move[] = [...state.moves, { type: 'tap', row: action.row, col: action.col }];
      const { blockerId, freeCells } = scanPath(arrow, state.arrows, state.level.size);
      if (blockerId === null) {
        const arrows = state.arrows.filter(a => a.id !== arrow.id);
        const streak = state.streak + 1;
        const won = arrows.length === 0;
        return {
          ...state,
          moves,
          arrows,
          leaving: [...state.leaving, arrow],
          streak,
          bestStreak: Math.max(state.bestStreak, streak),
          // Mid-run the score can dip below zero after an early undo; a finished run never does.
          score: won
            ? Math.max(0, state.score + pointsForTap(streak) + finishBonus(state.lives))
            : state.score + pointsForTap(streak),
          hintId: state.hintId === arrow.id ? null : state.hintId,
          lastMistake: null,
          status: won ? 'won' : 'playing',
        };
      }
      const lives = state.lives - 1;
      return {
        ...state,
        moves,
        lives,
        mistakes: state.mistakes + 1,
        streak: 0,
        lastMistake: { streak: state.streak },
        bump: { id: arrow.id, cells: freeCells, nonce: (state.bump?.nonce ?? 0) + 1 },
        status: lives <= 0 ? 'lost' : 'playing',
      };
    }
    case 'undo': {
      // Takes back the blocked tap just made (even the one that ended the run).
      if (!canUndo(state)) {
        return state;
      }
      return {
        ...state,
        moves: [...state.moves, { type: 'undo' }],
        lives: state.lives + 1,
        mistakes: state.mistakes - 1,
        streak: state.lastMistake!.streak,
        score: state.score - UNDO_COST, // always costs, even before any points are earned
        undosLeft: state.undosLeft - 1,
        lastMistake: null,
        bump: null,
        status: 'playing',
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
        lastMistake: null,
        moves: [...state.moves, { type: 'hint' }],
      };
    }
    case 'restart':
      return initGame(state.level);
  }
}
