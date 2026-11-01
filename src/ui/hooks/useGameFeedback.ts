import { useEffect, useRef } from 'react';
import { useSettings } from '../../store/hooks';
import { Vibration } from 'react-native';
import { playSound } from '../../services/sound';
import { Feedback, feedbackFor } from '../../state/feedback';
import { GameState } from '../../state/gameReducer';

const HAPTICS: Partial<Record<Feedback, number>> = { bump: 40, lose: 150 };

/** Plays sounds and haptics for each game transition, honoring settings. */
export function useGameFeedback(state: GameState) {
  const { settings } = useSettings();
  const prev = useRef(state);

  useEffect(() => {
    const events = feedbackFor(prev.current, state);
    prev.current = state;
    for (const e of events) {
      if (settings.sound) {
        playSound(e, state.streak);
      }
      const ms = HAPTICS[e];
      if (settings.vibration && ms) {
        Vibration.vibrate(ms);
      }
    }
  }, [state, settings]);
}
