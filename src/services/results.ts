import { api, ApiError } from '../data/api';
import { loadOutbox, PendingResult, saveOutbox } from '../data/storage';

const MAX_PENDING = 200;

export type Outcome =
  | { status: 'sent'; score: number; stars: number; rank?: number | null }
  | { status: 'queued'; reason: 'offline' | 'not_joined' | 'reauth' }
  | { status: 'rejected'; code: string };

export function sendResult(token: string, r: PendingResult) {
  return r.kind === 'daily'
    ? api.submitDaily(token, r.key, r.moves, r.durationMs)
    : api.submitLevel(token, Number(r.key), r.moves, r.durationMs);
}

/** One pending run per daily/level: keep the best, so the queue stays small. */
export function mergePending(list: PendingResult[], r: PendingResult): PendingResult[] {
  const same = list.find(x => x.kind === r.kind && x.key === r.key);
  if (same && (same.score ?? 0) >= r.score) {
    return list;
  }
  return [...list.filter(x => x !== same), r].slice(-MAX_PENDING);
}

// Outbox reads/writes run one at a time so a flush and a new win never race.
let chain: Promise<unknown> = Promise.resolve();
function serial<T>(task: () => Promise<T>): Promise<T> {
  const next = chain.then(task, task);
  chain = next.catch(() => {});
  return next;
}

export const queueResult = (r: PendingResult) =>
  serial(async () => saveOutbox(mergePending(await loadOutbox(), r)));

export interface FlushReport {
  sent: number;
  dropped: number;
  unauthorized: boolean; // token no longer valid: player must join again
}

/**
 * Sends queued results in order. Stops at the first offline / rate-limited /
 * server error or 401 and keeps everything from there, so nothing is lost and
 * the server is not hammered. Results rejected for good (closed day, invalid
 * run) are dropped.
 */
export const flushOutbox = (token: string) =>
  serial(async (): Promise<FlushReport> => {
    const pending = await loadOutbox();
    const report: FlushReport = { sent: 0, dropped: 0, unauthorized: false };
    let i = 0;
    for (; i < pending.length; i++) {
      try {
        await sendResult(token, pending[i]);
        report.sent++;
      } catch (e) {
        if (e instanceof ApiError && (e.status === 401 || e.retryable)) {
          report.unauthorized = e.status === 401;
          break;
        }
        report.dropped++;
        console.warn('dropping rejected result', pending[i].kind, pending[i].key, e);
      }
    }
    await saveOutbox(pending.slice(i));
    return report;
  });
