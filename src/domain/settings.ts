export interface Settings {
  sound: boolean;
  vibration: boolean;
}

export const DEFAULT_SETTINGS: Settings = { sound: true, vibration: true };

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
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
