import React from 'react';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';
import { colors } from '../theme';

/** A small bent arrow escaping a dot grid. */
export function Logo({ size = 120 }: { size?: number }) {
  const dots = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      dots.push(<Circle key={`${r}${c}`} cx={12 + c * 24} cy={12 + r * 24} r={2.5} fill={colors.dot} />);
    }
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {dots}
      <Path
        d="M12 108 L12 60 L60 60 L60 36 L100 36"
        stroke={colors.ink}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Polygon points="116,36 98,25 98,47" fill={colors.accent} />
    </Svg>
  );
}
