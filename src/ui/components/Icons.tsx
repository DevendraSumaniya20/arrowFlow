import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { usePalette } from '../theme';

// One drawn icon family: 24-unit grid, 2px round strokes.
interface IconProps {
  size?: number;
  color?: string;
}

function Stroke({ size = 24, color, children }: IconProps & { children: React.ReactNode }) {
  const c = usePalette();
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? c.accent}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round">
      {children}
    </Svg>
  );
}

const HEART =
  'M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z';
const STAR = 'M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z';

export function Heart({ filled, size = 26 }: { filled: boolean; size?: number }) {
  const c = usePalette();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={HEART} fill={filled ? c.danger : c.border} />
    </Svg>
  );
}

export function Star({ filled, size = 16 }: { filled: boolean; size?: number }) {
  const c = usePalette();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={STAR} fill={filled ? c.star : c.border} strokeLinejoin="round" />
    </Svg>
  );
}

/** Row of 3 stars, `count` filled. */
export function Stars({ count, size = 16 }: { count: number; size?: number }) {
  return (
    <>
      {[0, 1, 2].map(i => (
        <Star key={i} filled={i < count} size={size} />
      ))}
    </>
  );
}

export function Bulb(p: IconProps) {
  return (
    <Stroke {...p}>
      <Path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
    </Stroke>
  );
}

export function Restart(p: IconProps) {
  return (
    <Stroke {...p}>
      <Path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />
    </Stroke>
  );
}

export function ChevronLeft(p: IconProps) {
  return (
    <Stroke {...p}>
      <Path d="M15 5l-7 7 7 7" />
    </Stroke>
  );
}

export function ChevronRight(p: IconProps) {
  return (
    <Stroke {...p}>
      <Path d="M9 5l7 7-7 7" />
    </Stroke>
  );
}

export function Lock(p: IconProps) {
  return (
    <Stroke {...p}>
      <Rect x={5} y={11} width={14} height={10} rx={2} />
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Stroke>
  );
}

export function Podium(p: IconProps) {
  return (
    <Stroke {...p}>
      <Path d="M3 20h18M5 20v-6h4v6M10 20V9h4v11M15 20v-8h4v8" />
    </Stroke>
  );
}

export function Flame(p: IconProps) {
  return (
    <Stroke {...p}>
      <Path d="M12 21c-3.9 0-7-2.8-7-6.6 0-3 2-5.2 3.6-6.8.4 1.6 1.4 2.8 2.6 3.4C11 7.4 12 4.6 14.6 3c-.2 2.8 1 4.6 2.5 6.2A7.3 7.3 0 0 1 19 14.4C19 18.2 15.9 21 12 21z" />
    </Stroke>
  );
}

export function Grid(p: IconProps) {
  return (
    <Stroke {...p}>
      <Rect x={4} y={4} width={6} height={6} rx={1.5} />
      <Rect x={14} y={4} width={6} height={6} rx={1.5} />
      <Rect x={4} y={14} width={6} height={6} rx={1.5} />
      <Rect x={14} y={14} width={6} height={6} rx={1.5} />
    </Stroke>
  );
}

// Gear outline adapted from Feather Icons (MIT).
export function Gear(p: IconProps) {
  return (
    <Stroke {...p}>
      <Circle cx={12} cy={12} r={3} />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Stroke>
  );
}

export function Undo(p: IconProps) {
  return (
    <Stroke {...p}>
      <Path d="M9 14L4 9l5-5" />
      <Path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </Stroke>
  );
}

export function Trophy(p: IconProps) {
  return (
    <Stroke {...p}>
      <Path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <Path d="M17 6h3v1a3 3 0 0 1-3 3M7 6H4v1a3 3 0 0 0 3 3" />
    </Stroke>
  );
}

export function Share(p: IconProps) {
  return (
    <Stroke {...p}>
      <Path d="M12 3v12M8 7l4-4 4 4" />
      <Path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </Stroke>
  );
}

export function Bell(p: IconProps) {
  return (
    <Stroke {...p}>
      <Path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2zM10 21h4" />
    </Stroke>
  );
}
