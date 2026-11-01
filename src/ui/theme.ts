import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

// Apple system colours (iOS HIG): grouped background, label greys, system blue.
const light = {
  bg: '#f2f2f7', // systemGroupedBackground
  surface: '#ffffff', // secondarySystemGroupedBackground
  surfaceAlt: '#e9e9ee', // tertiary fill: segmented track, gray buttons, fields
  border: '#c6c6c8', // opaqueSeparator, drawn as a hairline
  dot: '#c7c7cc', // systemGray4
  ink: '#1c1c1e', // arrows
  text: '#000000', // label
  muted: '#6c6c70', // secondaryLabel, darkened to keep 4.5:1
  accent: '#007aff', // systemBlue
  accentSoft: '#e3eeff',
  onAccent: '#ffffff',
  danger: '#ff3b30', // systemRed
  star: '#ff9500', // systemOrange
  overlay: 'rgba(0, 0, 0, 0.4)',
};

export type Palette = typeof light;

const dark: Palette = {
  bg: '#000000',
  surface: '#1c1c1e',
  surfaceAlt: '#2c2c2e',
  border: '#38383a',
  dot: '#48484a',
  ink: '#ffffff',
  text: '#ffffff',
  muted: '#98989f',
  accent: '#0a84ff',
  accentSoft: '#0b2a4f',
  onAccent: '#ffffff',
  danger: '#ff453a',
  star: '#ff9f0a',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

/** iOS text styles (pt). Android maps them 1:1 to sp so both follow font-size settings. */
export const type = {
  largeTitle: { fontSize: 34, fontWeight: '700' as const, letterSpacing: 0.37 },
  title1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: 0.36 },
  title2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: 0.35 },
  title3: { fontSize: 20, fontWeight: '600' as const, letterSpacing: 0.38 },
  headline: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.41 },
  body: { fontSize: 17, fontWeight: '400' as const, letterSpacing: -0.41 },
  callout: { fontSize: 16, fontWeight: '400' as const, letterSpacing: -0.32 },
  subhead: { fontSize: 15, fontWeight: '400' as const, letterSpacing: -0.24 },
  footnote: { fontSize: 13, fontWeight: '400' as const, letterSpacing: -0.08 },
  caption: { fontSize: 12, fontWeight: '400' as const },
};

/** Apple's continuous ("squircle") corners; ignored where unsupported. */
export const rounded = (radius: number) => ({ borderRadius: radius, borderCurve: 'continuous' as const });

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

/** Styles that follow light/dark. `factory` must be a module-level function. */
export function useStyles<T>(factory: (c: Palette) => T): T {
  const c = usePalette();
  return useMemo(() => factory(c), [c, factory]);
}
