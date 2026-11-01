import { GameState } from './gameReducer';

export type Feedback = 'slide' | 'bump' | 'hint' | 'undo' | 'win' | 'lose';

/** Sound/haptic events caused by one state transition. Restarts are silent. */
export function feedbackFor(prev: GameState, next: GameState): Feedback[] {
  if (prev === next || next.arrows.length > prev.arrows.length) {
    return [];
  }
  const out: Feedback[] = [];
  if (next.arrows.length < prev.arrows.length) {
    out.push('slide');
  }
  if (next.bump && next.bump !== prev.bump) {
    out.push('bump');
  }
  if (next.lives > prev.lives) {
    out.push('undo');
  }
  if (next.hintId !== null && next.hintId !== prev.hintId) {
    out.push('hint');
  }
  if (next.status !== prev.status && next.status !== 'playing') {
    // (undo can move 'lost' back to 'playing'; that transition is covered above)
    out.push(next.status === 'won' ? 'win' : 'lose');
  }
  return out;
}
