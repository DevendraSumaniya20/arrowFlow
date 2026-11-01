import { api, ApiError } from '../data/api';
import { loadOutbox, PendingResult, saveOutbox } from '../data/storage';

const MAX_PENDING = 200;

export type Submitted = { score: number; stars: number; rank?: number | null };

export function sendResult(token: string, r: PendingResult): Promise<Submitted> {
  return r.kind === 'daily'
    ? api.submitDaily(token, r.key, r.moves, r.durationMs)
    : api.submitLevel(token, Number(r.key), r.moves, r.durationMs);
}

// Outbox reads/writes run one at a time so a flush and a new win never race.
let chain: Promise<unknown> = Promise.resolve();
function serial<T>(task: () => Promise<T>): Promise<T> {
  const next = chain.then(task, task);
  chain = next.catch(() => {});
  return next;
}

export const queueResult = (r: PendingResult) =>
  serial(async () => saveOutbox([...(await loadOutbox()), r].slice(-MAX_PENDING)));

/**
 * Sends queued results. Keeps the ones that failed for a retryable reason
 * (offline, server down); drops ones the server rejected for good.
 */
export const flushOutbox = (token: string) =>
  serial(async () => {
    const pending = await loadOutbox();
    const keep: PendingResult[] = [];
    for (const item of pending) {
      try {
        await sendResult(token, item);
      } catch (e) {
        if (e instanceof ApiError && e.retryable) {
          keep.push(item);
        } else {
          console.warn('dropping rejected result', item.kind, item.key, e);
        }
      }
    }
    await saveOutbox(keep);
    return pending.length - keep.length;
  });
