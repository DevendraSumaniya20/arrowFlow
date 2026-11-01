import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { api, ApiError, Player } from '../data/api';
import { loadPlayer, PendingResult, savePlayer } from '../data/storage';
import { flushOutbox, queueResult, sendResult, Submitted } from '../services/results';
import { usePersistentState } from './usePersistentState';

interface PlayerValue {
  loaded: boolean;
  player: Player | null;
  /** Throws ApiError (e.g. invalid nickname, offline). */
  register: (nickname: string) => Promise<void>;
  rename: (nickname: string) => Promise<void>;
  /** Sends a verified run; queues it when offline or not registered yet. */
  submit: (result: PendingResult) => Promise<Submitted | null>;
}

const PlayerContext = createContext<PlayerValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer, loaded] = usePersistentState<Player | null>(loadPlayer, savePlayer, null);
  const token = player?.token;

  // Deliver anything won while offline as soon as we have an identity.
  useEffect(() => {
    if (token) {
      flushOutbox(token).catch(() => {});
    }
  }, [token]);

  const register = useCallback(
    async (nickname: string) => setPlayer(await api.register(nickname)),
    [setPlayer],
  );

  const rename = useCallback(
    async (nickname: string) => {
      if (!player) {
        return;
      }
      const res = await api.rename(player.token, nickname);
      setPlayer({ ...player, nickname: res.nickname });
    },
    [player, setPlayer],
  );

  const submit = useCallback(
    async (result: PendingResult) => {
      if (!token) {
        await queueResult(result); // sent after the player joins
        return null;
      }
      try {
        return await sendResult(token, result);
      } catch (e) {
        if (e instanceof ApiError && e.retryable) {
          await queueResult(result);
        } else {
          console.warn('result rejected', e);
        }
        return null;
      }
    },
    [token],
  );

  const value = useMemo(
    () => ({ loaded, player, register, rename, submit }),
    [loaded, player, register, rename, submit],
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
