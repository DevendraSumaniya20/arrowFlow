import { dailyStreak, Progress, totalStars } from './progress';

/** What happened in the run that was just won. */
export interface RunStats {
  kind: 'level' | 'daily';
  date?: string; // daily runs
  size: number; // board size
  mistakes: number;
  hintsUsed: number;
  undosUsed: number;
  bestStreak: number;
  durationMs: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  /** True once the achievement is earned, given progress after the win. */
  earned: (p: Progress, run: RunStats) => boolean;
  /** Optional [current, goal] so locked counters can show how close they are. */
  progress?: (p: Progress) => [number, number];
}

const cleared = (p: Progress) => p.unlocked - 1;
const counter =
  (goal: number, of: (p: Progress) => number) =>
  (p: Progress): [number, number] =>
    [Math.min(of(p), goal), goal];
const streakOf = (p: Progress, run?: RunStats) =>
  run?.kind === 'daily' && run.date ? dailyStreak(p, run.date) : 0;

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_clear',
    title: 'First Flow',
    description: 'Clear your first level.',
    earned: p => cleared(p) >= 1,
  },
  {
    id: 'levels_10',
    title: 'Warming Up',
    description: 'Clear 10 levels.',
    earned: p => cleared(p) >= 10,
    progress: counter(10, cleared),
  },
  {
    id: 'levels_50',
    title: 'In the Flow',
    description: 'Clear 50 levels.',
    earned: p => cleared(p) >= 50,
    progress: counter(50, cleared),
  },
  {
    id: 'levels_100',
    title: 'Arrow Master',
    description: 'Clear 100 levels.',
    earned: p => cleared(p) >= 100,
    progress: counter(100, cleared),
  },
  {
    id: 'flawless',
    title: 'Flawless',
    description: 'Clear a board without a single blocked tap.',
    earned: (_p, r) => r.mistakes === 0 && r.undosUsed === 0,
  },
  {
    id: 'unassisted',
    title: 'Unassisted',
    description: 'Clear an Expert board without hints.',
    earned: (_p, r) => r.size >= 12 && r.hintsUsed === 0,
  },
  {
    id: 'quick',
    title: 'Quick Thinker',
    description: 'Clear an 8×8 or bigger board in under 30 seconds.',
    earned: (_p, r) => r.size >= 8 && r.durationMs < 30_000,
  },
  {
    id: 'combo_10',
    title: 'Chain Reaction',
    description: 'Reach a combo of 10.',
    earned: (_p, r) => r.bestStreak >= 10,
  },
  {
    id: 'daily_first',
    title: 'Daily Habit',
    description: 'Clear your first daily challenge.',
    earned: (_p, r) => r.kind === 'daily',
  },
  {
    id: 'streak_3',
    title: 'On a Roll',
    description: 'Clear the daily challenge 3 days in a row.',
    earned: (p, r) => streakOf(p, r) >= 3,
  },
  {
    id: 'streak_7',
    title: 'Week Strong',
    description: 'Clear the daily challenge 7 days in a row.',
    earned: (p, r) => streakOf(p, r) >= 7,
  },
  {
    id: 'stars_100',
    title: 'Star Collector',
    description: 'Earn 100 stars.',
    earned: p => totalStars(p) >= 100,
    progress: counter(100, totalStars),
  },
];

/** Achievements this win earns that the player did not have yet. */
export function newlyEarned(after: Progress, run: RunStats): Achievement[] {
  return ACHIEVEMENTS.filter(a => !after.achievements[a.id] && a.earned(after, run));
}

/** Records new achievements with the time they were earned. */
export function grantAchievements(p: Progress, run: RunStats, at: string): Progress {
  const earned = newlyEarned(p, run);
  if (earned.length === 0) {
    return p;
  }
  const achievements = { ...p.achievements };
  earned.forEach(a => (achievements[a.id] = at));
  return { ...p, achievements };
}
