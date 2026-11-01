import React from 'react';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';
import { usePalette } from '../theme';

/** A small bent arrow escaping a dot grid. */
export function Logo({ size = 120 }: { size?: number }) {
  const c = usePalette();
  const dots = [];
  for (let r = 0; r < 5; r++) {
    for (let col = 0; col < 5; col++) {
      dots.push(<Circle key={`${r}${col}`} cx={12 + col * 24} cy={12 + r * 24} r={2.5} fill={c.dot} />);
    }
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {dots}
      <Path
        d="M12 108 L12 60 L60 60 L60 36 L100 36"
        stroke={c.ink}
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Polygon points="118,36 96,22 96,50" fill={c.accent} />
    </Svg>
  );
}
