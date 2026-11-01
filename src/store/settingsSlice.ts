import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_SETTINGS, Settings } from '../domain/settings';

interface SettingsState {
  loaded: boolean;
  value: Settings;
}

const initialState: SettingsState = { loaded: false, value: DEFAULT_SETTINGS };

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    settingsLoaded: (_s, a: PayloadAction<Settings>) => ({ loaded: true, value: a.payload }),
    settingsUpdated: (s, a: PayloadAction<Partial<Settings>>) => {
      s.value = { ...s.value, ...a.payload };
    },
  },
});

export const { settingsLoaded, settingsUpdated } = settingsSlice.actions;
