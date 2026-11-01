import { AudioContext, AudioManager, OscillatorType } from 'react-native-audio-api';
import type { Feedback } from '../state/feedback';

// All effects are synthesized, so the app ships no audio files.
let ctx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!ctx) {
    // Ambient: mixes with the player's music and respects the iOS silent switch.
    AudioManager.setAudioSessionOptions({ iosCategory: 'ambient', iosOptions: ['mixWithOthers'] });
    ctx = new AudioContext();
  }
  return ctx;
}

interface Tone {
  freq: number;
  to?: number; // glide target
  at?: number; // delay in seconds
  dur: number;
  vol?: number;
  type?: OscillatorType;
}

function tone(c: AudioContext, { freq, to, at = 0, dur, vol = 0.2, type = 'sine' }: Tone) {
  const t0 = c.currentTime + at;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) {
    osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  }
  // Short attack + exponential decay avoids clicks.
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const WIN_NOTES = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
const LOSE_NOTES = [392, 329.63, 261.63]; // G4 E4 C4

/** Slide pitch climbs with the combo streak. Sound must never break the game. */
export function playSound(name: Feedback, streak = 1) {
  try {
    const c = getContext();
    switch (name) {
      case 'slide': {
        const base = 420 * Math.pow(1.06, Math.min(Math.max(streak, 1), 12) - 1);
        tone(c, { freq: base, to: base * 2.2, dur: 0.16, vol: 0.18 });
        break;
      }
      case 'bump':
        tone(c, { freq: 160, to: 70, dur: 0.14, vol: 0.3, type: 'triangle' });
        break;
      case 'undo': // a soft rewind: falling glide
        tone(c, { freq: 700, to: 350, dur: 0.22, vol: 0.14 });
        break;
      case 'hint':
        tone(c, { freq: 880, dur: 0.12, vol: 0.12 });
        tone(c, { freq: 1320, at: 0.1, dur: 0.18, vol: 0.12 });
        break;
      case 'win': // starts after the last arrow's slide
        WIN_NOTES.forEach((f, i) =>
          tone(c, { freq: f, at: 0.3 + i * 0.1, dur: 0.25, vol: 0.18, type: 'triangle' }),
        );
        break;
      case 'lose':
        LOSE_NOTES.forEach((f, i) =>
          tone(c, { freq: f, at: 0.1 + i * 0.16, dur: 0.22, vol: 0.18, type: 'triangle' }),
        );
        break;
    }
  } catch (e) {
    console.warn('sound failed', e);
  }
}
