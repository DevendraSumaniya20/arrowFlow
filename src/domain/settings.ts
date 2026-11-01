import { REMINDER_TIMES, ReminderTime } from './reminder';

export type Appearance = 'system' | 'light' | 'dark';

export interface Settings {
  sound: boolean;
  vibration: boolean;
  appearance: Appearance;
  reminder: boolean; // off until the player turns it on (it asks for permission)
  reminderTime: ReminderTime;
}

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  vibration: true,
  appearance: 'system',
  reminder: false,
  reminderTime: 'evening',
};

const APPEARANCES: Appearance[] = ['system', 'light', 'dark'];

/** Keeps every valid stored field; anything missing or corrupt falls back to the default. */
export function parseSettings(raw: string | null): Settings {
  if (!raw) {
    return DEFAULT_SETTINGS;
  }
  try {
    const v = JSON.parse(raw);
    return {
      sound: typeof v?.sound === 'boolean' ? v.sound : DEFAULT_SETTINGS.sound,
      vibration: typeof v?.vibration === 'boolean' ? v.vibration : DEFAULT_SETTINGS.vibration,
      appearance: APPEARANCES.includes(v?.appearance) ? v.appearance : DEFAULT_SETTINGS.appearance,
      reminder: typeof v?.reminder === 'boolean' ? v.reminder : DEFAULT_SETTINGS.reminder,
      reminderTime: REMINDER_TIMES.some(t => t.key === v?.reminderTime)
        ? v.reminderTime
        : DEFAULT_SETTINGS.reminderTime,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
