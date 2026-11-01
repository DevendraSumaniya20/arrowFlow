import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { utcDate } from '../../domain/daily';
import { serverNow, syncClock } from '../../services/clock';

/**
 * Today's daily date (UTC, server-corrected). Re-checks every 30s and when the
 * app returns to the foreground, so it rolls over at midnight while open.
 */
export function useToday(): { today: string; now: Date } {
  const [now, setNow] = useState(serverNow);

  useEffect(() => {
    const tick = () => setNow(serverNow());
    syncClock().then(tick);
    const timer = setInterval(tick, 30_000);
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') {
        syncClock().then(tick);
      }
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);

  return { today: utcDate(now), now };
}
