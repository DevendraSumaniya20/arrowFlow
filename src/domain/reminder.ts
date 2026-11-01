import { utcDate } from './daily';

export const REMINDER_TIMES = [
  { key: 'morning', label: 'Morning', hour: 9, minute: 0 },
  { key: 'noon', label: 'Noon', hour: 12, minute: 30 },
  { key: 'evening', label: 'Evening', hour: 19, minute: 0 },
  { key: 'night', label: 'Night', hour: 21, minute: 0 },
] as const;

export type ReminderTime = (typeof REMINDER_TIMES)[number]['key'];

export const REMINDER_DAYS = 7;

/**
 * The next reminder moments at the chosen local time, skipping any day whose
 * daily challenge (UTC date at that moment) is already cleared, so a player
 * who has played is never nagged.
 */
export function planReminders(
  now: Date,
  time: ReminderTime,
  cleared: Record<string, unknown>,
  days = REMINDER_DAYS,
): Date[] {
  const { hour, minute } = REMINDER_TIMES.find(t => t.key === time)!;
  const out: Date[] = [];
  for (let i = 0; i <= days && out.length < days; i++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, hour, minute);
    if (at > now && !cleared[utcDate(at)]) {
      out.push(at);
    }
  }
  return out;
}
