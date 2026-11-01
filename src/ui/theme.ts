import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

// Apple system colours (iOS HIG), adjusted where needed to pass WCAG AA:
// text >= 4.5:1, controls >= 3:1. src/ui/__tests__/contrast.test.ts enforces it.
export const light = {
  bg: '#f2f2f7', // systemGroupedBackground
  surface: '#ffffff', // secondarySystemGroupedBackground
  surfaceAlt: '#e9e9ee', // tertiary fill: segmented track, gray buttons, fields
  border: '#c6c6c8', // opaqueSeparator, drawn as a hairline
  dot: '#c7c7cc', // systemGray4
  ink: '#1c1c1e', // arrows
  text: '#000000', // label
  muted: '#6c6c70', // secondaryLabel, darkened to keep 4.5:1
  accent: '#0062cc', // systemBlue, accessible tone: tint for text and icons
  accentFill: '#0062cc', // filled buttons and badges, behind onAccent
  accentSoft: '#e3eeff',
  onAccent: '#ffffff',
  danger: '#c4001a', // systemRed, accessible tone
  success: '#248a3d', // systemGreen, accessible tone (switch on)
  switchOff: '#8e8e93', // systemGray: off track must show against white
  star: '#ff9500', // systemOrange
  overlay: 'rgba(0, 0, 0, 0.4)',
};

export type Palette = typeof light;

export const dark: Palette = {
  bg: '#000000',
  surface: '#1c1c1e',
  surfaceAlt: '#2c2c2e',
  border: '#38383a',
  dot: '#48484a',
  ink: '#ffffff',
  text: '#ffffff',
  muted: '#98989f',
  accent: '#409cff', // lighter tint so text stays readable on dark fills
  accentFill: '#0a6fd6', // darker fill so white labels stay readable
  accentSoft: '#0b2a4f',
  onAccent: '#ffffff',
  danger: '#ff6961',
  success: '#30d158',
  switchOff: '#7c7c80',
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
  caption2: { fontSize: 11, fontWeight: '400' as const, letterSpacing: 0.07 }, // Apple's floor
};

/** Apple's continuous ("squircle") corners; ignored where unsupported. */
export const rounded = (radius: number, side?: 'top' | 'bottom') => {
  const curve = { borderCurve: 'continuous' as const };
  if (side === 'top') {
    return { borderTopLeftRadius: radius, borderTopRightRadius: radius, ...curve };
  }
  if (side === 'bottom') {
    return { borderBottomLeftRadius: radius, borderBottomRightRadius: radius, ...curve };
  }
  return { borderRadius: radius, ...curve };
};

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

/** Styles that follow light/dark. `factory` must be a module-level function. */
export function useStyles<T>(factory: (c: Palette) => T): T {
  const c = usePalette();
  return useMemo(() => factory(c), [c, factory]);
}
