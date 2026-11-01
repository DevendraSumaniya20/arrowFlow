import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { api, ApiError, Player } from '../data/api';
import { loadPlayer, PendingResult, savePlayer } from '../data/storage';
import { flushOutbox, Outcome, queueResult, sendResult } from '../services/results';
import { usePersistentState } from './usePersistentState';

interface PlayerValue {
  loaded: boolean;
  player: Player | null;
  /** Set when the server stopped accepting this phone's token. */
  expired: boolean;
  /** Throws ApiError (e.g. invalid nickname, offline). */
  register: (nickname: string) => Promise<void>;
  rename: (nickname: string) => Promise<void>;
  /** Sends a verified run, or queues it; never loses a run that can still count. */
  submit: (result: PendingResult) => Promise<Outcome>;
}

const PlayerContext = createContext<PlayerValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer, loaded] = usePersistentState<Player | null>(loadPlayer, savePlayer, null);
  const [expired, setExpired] = useState(false);
  const token = player?.token;

  const signOutExpired = useCallback(() => {
    setPlayer(null);
    setExpired(true);
  }, [setPlayer]);

  const flush = useCallback(async () => {
    if (!token) {
      return;
    }
    const report = await flushOutbox(token).catch(() => null);
    if (report?.unauthorized) {
      signOutExpired();
    }
  }, [token, signOutExpired]);

  // Deliver queued wins on launch, after joining, and whenever the app comes back.
  useEffect(() => {
    flush();
    const sub = AppState.addEventListener('change', s => s === 'active' && flush());
    return () => sub.remove();
  }, [flush]);

  const register = useCallback(
    async (nickname: string) => {
      setPlayer(await api.register(nickname));
      setExpired(false);
    },
    [setPlayer],
  );

  const rename = useCallback(
    async (nickname: string) => {
      if (!player) {
        return;
      }
      try {
        const res = await api.rename(player.token, nickname);
        setPlayer({ ...player, nickname: res.nickname });
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          signOutExpired();
        }
        throw e;
      }
    },
    [player, setPlayer, signOutExpired],
  );

  const submit = useCallback(
    async (result: PendingResult): Promise<Outcome> => {
      if (!token) {
        // Only today's daily is kept for later; campaign runs count once joined.
        if (result.kind === 'daily') {
          await queueResult(result);
        }
        return { status: 'queued', reason: 'not_joined' };
      }
      try {
        const res = await sendResult(token, result);
        flush(); // we're online: send anything still waiting
        return { status: 'sent', ...res };
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          await queueResult(result);
          signOutExpired();
          return { status: 'queued', reason: 'reauth' };
        }
        if (e instanceof ApiError && e.retryable) {
          await queueResult(result);
          return { status: 'queued', reason: 'offline' };
        }
        return { status: 'rejected', code: e instanceof ApiError ? e.code : 'error' };
      }
    },
    [token, flush, signOutExpired],
  );

  const value = useMemo(
    () => ({ loaded, player, expired, register, rename, submit }),
    [loaded, player, expired, register, rename, submit],
  );
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error('usePlayer must be used inside PlayerProvider');
  }
  return ctx;
}
