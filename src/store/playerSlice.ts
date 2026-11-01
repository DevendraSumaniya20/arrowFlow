import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api, ApiError, Player } from '../data/api';
import { PendingResult } from '../data/storage';
import { flushOutbox, Outcome, queueResult, sendResult } from '../services/results';

interface PlayerState {
  loaded: boolean;
  current: Player | null;
  /** Set when the server stopped accepting this phone's token. */
  expired: boolean;
}

const initialState: PlayerState = { loaded: false, current: null, expired: false };

export const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    playerLoaded: (s, a: PayloadAction<Player | null>) => {
      s.loaded = true;
      s.current = a.payload;
    },
    playerJoined: (s, a: PayloadAction<Player>) => {
      s.current = a.payload;
      s.expired = false;
    },
    playerRenamed: (s, a: PayloadAction<string>) => {
      if (s.current) {
        s.current.nickname = a.payload;
      }
    },
    playerExpired: s => {
      s.current = null;
      s.expired = true;
    },
  },
});

export const { playerLoaded, playerJoined, playerRenamed, playerExpired } = playerSlice.actions;

/** Serializable error the UI can branch on (status 0 = offline). */
export interface ApiFailure {
  status: number;
  code: string;
  message: string;
}
const failure = (e: unknown): ApiFailure =>
  e instanceof ApiError
    ? { status: e.status, code: e.code, message: e.message }
    : { status: -1, code: 'error', message: String(e) };

type ThunkCfg = { state: { player: PlayerState }; rejectValue: ApiFailure };

export const registerPlayer = createAsyncThunk<Player, string, ThunkCfg>(
  'player/register',
  async (nickname, { dispatch, rejectWithValue }) => {
    try {
      const player = await api.register(nickname);
      dispatch(playerJoined(player));
      return player;
    } catch (e) {
      return rejectWithValue(failure(e));
    }
  },
);

export const renamePlayer = createAsyncThunk<void, string, ThunkCfg>(
  'player/rename',
  async (nickname, { getState, dispatch, rejectWithValue }) => {
    const player = getState().player.current;
    if (!player) {
      return;
    }
    try {
      dispatch(playerRenamed((await api.rename(player.token, nickname)).nickname));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        dispatch(playerExpired());
      }
      return rejectWithValue(failure(e));
    }
  },
);

/** Sends queued wins; a dead token signs the player out but keeps the queue. */
export const flushResults = createAsyncThunk<void, void, ThunkCfg>(
  'player/flush',
  async (_, { getState, dispatch }) => {
    const token = getState().player.current?.token;
    if (!token) {
      return;
    }
    const report = await flushOutbox(token).catch(() => null);
    if (report?.unauthorized) {
      dispatch(playerExpired());
    }
  },
);

/** Sends a verified run, or queues it; never loses a run that can still count. */
export const submitResult = createAsyncThunk<Outcome, PendingResult, ThunkCfg>(
  'player/submit',
  async (result, { getState, dispatch }) => {
    const token = getState().player.current?.token;
    if (!token) {
      // Only today's daily is kept for later; campaign runs count once joined.
      if (result.kind === 'daily') {
        await queueResult(result);
      }
      return { status: 'queued', reason: 'not_joined' };
    }
    try {
      const res = await sendResult(token, result);
      dispatch(flushResults()); // we're online: send anything still waiting
      return { status: 'sent', ...res };
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        await queueResult(result);
        dispatch(playerExpired());
        return { status: 'queued', reason: 'reauth' };
      }
      if (e instanceof ApiError && e.retryable) {
        await queueResult(result);
        return { status: 'queued', reason: 'offline' };
      }
      return { status: 'rejected', code: e instanceof ApiError ? e.code : 'error' };
    }
  },
);
