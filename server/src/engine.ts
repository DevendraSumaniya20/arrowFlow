// The game engine is shared with the app (../../src) so the server can rebuild
// any board and replay a player's moves exactly like the phone did.
export { generateLevel } from '../../src/domain/generator';
export { generateDailyLevel, dailyDifficulty, isValidDate, utcDate } from '../../src/domain/daily';
export { MAX_DURATION_MS, MIN_MS_PER_TAP, starsFor } from '../../src/domain/scoring';
export { gameReducer, initGame } from '../../src/state/gameReducer';
export type { Move } from '../../src/state/gameReducer';
export type { Level } from '../../src/domain/types';
