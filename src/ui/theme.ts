import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

const light = {
  bg: '#f5f6fb',
  surface: '#ffffff',
  surfaceAlt: '#eceef7', // chips, segmented control track
  border: '#e1e4ef',
  dot: '#c7ccdc',
  ink: '#1c2240', // arrows and primary text
  text: '#1c2240',
  muted: '#676d8a', // >= 4.5:1 on bg and surface
  accent: '#2f6bff',
  accentSoft: '#e4ecff', // own-row highlight, selected states
  onAccent: '#ffffff',
  danger: '#e5364b',
  star: '#f5a300',
  overlay: 'rgba(20, 24, 45, 0.55)',
};

export type Palette = typeof light;

const dark: Palette = {
  bg: '#0e1120',
  surface: '#171b2e',
  surfaceAlt: '#20253d',
  border: '#272d48',
  dot: '#353c60',
  ink: '#e8ebff',
  text: '#e8ebff',
  muted: '#a1a7c6',
  accent: '#6b95ff',
  accentSoft: '#1f2b52',
  onAccent: '#0b0e1a',
  danger: '#ff5f70',
  star: '#ffc23d',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

/** Styles that follow light/dark. `factory` must be a module-level function. */
export function useStyles<T>(factory: (c: Palette) => T): T {
  const c = usePalette();
  return useMemo(() => factory(c), [c, factory]);
}
