import { api } from '../data/api';

// Server time minus device time. Corrects phones with a wrong clock so the
// daily challenge matches the one the server accepts.
let offsetMs = 0;

export const serverNow = () => new Date(Date.now() + offsetMs);

export const offsetFrom = (serverIso: string, deviceMs: number) =>
  new Date(serverIso).getTime() - deviceMs;

/** Best effort: keeps the device clock when the server is unreachable. */
export async function syncClock(): Promise<void> {
  try {
    const sentAt = Date.now();
    const { now } = await api.daily();
    // Assume the server stamped the middle of the round trip.
    const offset = offsetFrom(now, (sentAt + Date.now()) / 2);
    // A missing or malformed `now` (old server, proxy page) must never break dates.
    if (Number.isFinite(offset)) {
      offsetMs = offset;
    }
  } catch {}
}
