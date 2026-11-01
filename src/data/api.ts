import { API_URL } from '../config';
import type { Move } from '../state/gameReducer';

export class ApiError extends Error {
  constructor(
    readonly status: number, // 0 = network error / timeout
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
  /** Worth retrying later (offline, timeout, server trouble, rate limited). */
  get retryable() {
    return this.status === 0 || this.status === 429 || this.status >= 500;
  }
}

async function request<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const { token, ...rest } = init;
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...rest.headers,
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new ApiError(res.status, body.error ?? 'error', body.message ?? `HTTP ${res.status}`);
    }
    return body as T;
  } catch (e) {
    if (e instanceof ApiError) {
      throw e;
    }
    throw new ApiError(0, 'network', "Can't reach the server");
  } finally {
    clearTimeout(timer);
  }
}

export interface Player {
  id: string;
  nickname: string;
  token: string;
}

export interface Verified {
  score: number;
  stars: number;
  mistakes: number;
}

export interface Entry {
  rank: number;
  playerId: string;
  nickname: string;
  score: number;
  stars: number;
  durationMs?: number;
  levels?: number;
}

export interface Board {
  entries: Entry[];
  me: Entry | null;
}

const post = (body: unknown, token?: string) => ({
  method: 'POST',
  body: JSON.stringify(body),
  token,
});

export const api = {
  register: (nickname: string) => request<Player>('/v1/players', post({ nickname })),
  rename: (token: string, nickname: string) =>
    request<{ id: string; nickname: string }>('/v1/players/me', {
      method: 'PATCH',
      body: JSON.stringify({ nickname }),
      token,
    }),
  daily: () => request<{ date: string; difficulty: number; endsAt: string }>('/v1/daily'),
  submitDaily: (token: string, date: string, moves: Move[], durationMs: number) =>
    request<Verified & { rank: number | null }>(
      `/v1/daily/${date}/results`,
      post({ moves, durationMs }, token),
    ),
  submitLevel: (token: string, level: number, moves: Move[], durationMs: number) =>
    request<Verified>(`/v1/levels/${level}/results`, post({ moves, durationMs }, token)),
  dailyBoard: (date: string, token?: string) =>
    request<Board & { date: string }>(`/v1/daily/${date}/leaderboard?limit=50`, { token }),
  globalBoard: (token?: string) => request<Board>('/v1/leaderboard?limit=50', { token }),
};
