import { DEFAULT_SETTINGS, parseSettings } from '../settings';

describe('parseSettings', () => {
  it('defaults when nothing is stored or data is corrupt', () => {
    expect(parseSettings(null)).toBe(DEFAULT_SETTINGS);
    expect(parseSettings('{oops')).toBe(DEFAULT_SETTINGS);
  });

  it('keeps valid fields and repairs bad ones', () => {
    expect(parseSettings('{"sound":false,"vibration":false}')).toEqual({
      sound: false,
      vibration: false,
    });
    expect(parseSettings('{"sound":false,"vibration":"yes"}')).toEqual({
      sound: false,
      vibration: true,
    });
  });
});
