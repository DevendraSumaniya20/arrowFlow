import { DEFAULT_SETTINGS, parseSettings } from '../settings';

describe('parseSettings', () => {
  it('defaults when nothing is stored or data is corrupt', () => {
    expect(parseSettings(null)).toBe(DEFAULT_SETTINGS);
    expect(parseSettings('{oops')).toBe(DEFAULT_SETTINGS);
  });

  it('keeps valid fields and repairs bad ones', () => {
    expect(parseSettings('{"sound":false,"vibration":false,"appearance":"dark"}')).toEqual({
      sound: false,
      vibration: false,
      appearance: 'dark',
      reminder: false,
      reminderTime: 'evening',
    });
    expect(parseSettings('{"sound":false,"vibration":"yes","appearance":"purple"}')).toEqual({
      sound: false,
      vibration: true,
      appearance: 'system',
      reminder: false,
      reminderTime: 'evening',
    });
  });

  it('loads settings saved before Appearance existed', () => {
    expect(parseSettings('{"sound":false,"vibration":true}').appearance).toBe('system');
  });
});
