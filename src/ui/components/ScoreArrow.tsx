import React from 'react';
import Svg, { Line, Polygon } from 'react-native-svg';

/**
 * A score drawn the way the board draws arrows: the line's length is the
 * score relative to the leader, ending in an arrowhead.
 */
export function ScoreArrow({ ratio, width, color }: { ratio: number; width: number; color: string }) {
  const h = 10;
  const head = 7;
  const end = Math.max(head + 4, Math.min(1, Math.max(0, ratio)) * (width - 2));
  const y = h / 2;
  return (
    <Svg width={width} height={h}>
      <Line x1={2} y1={y} x2={end - head + 1} y2={y} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Polygon points={`${end},${y} ${end - head},${y - 4.5} ${end - head},${y + 4.5}`} fill={color} />
    </Svg>
  );
}
