import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { loadSettings, saveSettings } from '../data/storage';
import { DEFAULT_SETTINGS, Settings } from '../domain/settings';
import { usePersistentState } from './usePersistentState';

interface SettingsValue {
  loaded: boolean;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings, loaded] = usePersistentState(
    loadSettings,
    saveSettings,
    DEFAULT_SETTINGS,
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => setSettings(s => ({ ...s, ...patch })),
    [setSettings],
  );

  const value = useMemo(
    () => ({ loaded, settings, updateSettings }),
    [loaded, settings, updateSettings],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used inside SettingsProvider');
  }
  return ctx;
}
