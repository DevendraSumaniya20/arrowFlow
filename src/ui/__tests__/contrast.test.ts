import { dark, light, Palette } from '../theme';

// WCAG 2.x relative luminance and contrast ratio.
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map(i => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

type Key = keyof Palette;

// Every foreground/background pairing the UI actually draws. Adding a new
// pairing to a screen means adding it here; a palette tweak that breaks
// readability fails this test instead of shipping.
const TEXT: [Key, Key, string][] = [
  ['text', 'bg', 'titles on the screen'],
  ['text', 'surface', 'rows and cards'],
  ['text', 'surfaceAlt', 'segmented control, chips'],
  ['muted', 'bg', 'captions'],
  ['muted', 'surface', 'secondary text in cards'],
  ['accent', 'bg', 'back button, links'],
  ['accent', 'surface', 'links in cards, Done'],
  ['accent', 'surfaceAlt', 'gray button labels'],
  ['accent', 'accentSoft', '"You" on your leaderboard row'],
  ['text', 'accentSoft', 'your leaderboard row'],
  ['onAccent', 'accentFill', 'filled buttons, hint badge'],
  ['danger', 'surface', 'Reset Progress, errors'],
  ['danger', 'surfaceAlt', 'destructive gray button'],
];

const CONTROLS: [Key, Key, string][] = [
  ['switchOff', 'surface', 'switch off track'],
  ['success', 'surface', 'switch on track'],
  ['ink', 'bg', 'arrows on the board'],
  ['danger', 'surface', 'filled hearts'],
];

describe.each([
  ['light', light],
  ['dark', dark],
])('%s palette contrast', (_name, c) => {
  it.each(TEXT)('%s on %s (%s) is at least 4.5:1', (fg, bg) => {
    expect(contrast(c[fg], c[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(CONTROLS)('%s on %s (%s) is at least 3:1', (fg, bg) => {
    expect(contrast(c[fg], c[bg])).toBeGreaterThanOrEqual(3);
  });
});
