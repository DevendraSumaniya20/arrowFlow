import { AudioContext } from 'react-native-audio-api';
import { playSound } from '../sound';

describe('playSound', () => {
  it('schedules oscillators for every effect', () => {
    const spy = jest.spyOn(AudioContext.prototype, 'createOscillator');
    for (const name of ['slide', 'bump', 'hint', 'win', 'lose'] as const) {
      playSound(name, 3);
    }
    // slide 1 + bump 1 + hint 2 + win 4 + lose 3
    expect(spy).toHaveBeenCalledTimes(11);
    spy.mockRestore();
  });

  it('never throws when audio fails', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const spy = jest.spyOn(AudioContext.prototype, 'createOscillator').mockImplementation(() => {
      throw new Error('no audio device');
    });
    expect(() => playSound('bump')).not.toThrow();
    expect(warn).toHaveBeenCalled();
    spy.mockRestore();
    warn.mockRestore();
  });
});
