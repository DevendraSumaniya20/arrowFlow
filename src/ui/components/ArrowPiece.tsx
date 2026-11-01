import React, { memo, useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { G, Path, Polygon } from 'react-native-svg';
import { pathAhead } from '../../domain/board';
import { Arrow, DELTA } from '../../domain/types';
import { Bump } from '../../state/gameReducer';
import { colors } from '../theme';

interface Props {
  arrow: Arrow;
  cell: number;
  size: number;
  hinted?: boolean;
  bump?: Bump | null;
  leaving?: boolean;
  onLeft?: (id: number) => void;
}

/**
 * The arrow is a dash sliding along a track: tail -> body -> head -> straight
 * out past the board edge. Moving the dash by `t` px gives the snake motion.
 */
export const ArrowPiece = memo(function ArrowPieceView({
  arrow,
  cell,
  size,
  hinted,
  bump,
  leaving,
  onLeft,
}: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const [t, setT] = useState(0);
  const [hurt, setHurt] = useState(false);

  useEffect(() => {
    const id = progress.addListener(({ value }) => setT(value));
    return () => progress.removeListener(id);
  }, [progress]);

  const exitCells = pathAhead(arrow, size).length + arrow.cells.length + 1;

  useEffect(() => {
    if (!leaving) {
      return;
    }
    Animated.timing(progress, {
      toValue: exitCells * cell,
      duration: 260 + exitCells * 22,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false, // drives SVG props
    }).start(() => onLeft?.(arrow.id));
  }, [leaving, progress, exitCells, cell, arrow.id, onLeft]);

  const bumpNonce = bump?.nonce;
  const bumpCells = bump?.cells ?? 0;
  useEffect(() => {
    if (bumpNonce === undefined) {
      return;
    }
    setHurt(true);
    Animated.sequence([
      Animated.timing(progress, {
        toValue: bumpCells * cell + cell * 0.3,
        duration: 90 + bumpCells * 30,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.spring(progress, {
        toValue: 0,
        speed: 20,
        bounciness: 10,
        useNativeDriver: false,
      }),
    ]).start(() => setHurt(false));
  }, [bumpNonce, bumpCells, cell, progress]);

  const center = (v: number) => (v + 0.5) * cell;
  const { dr, dc } = DELTA[arrow.dir];
  const [hr, hc] = arrow.cells[0];

  // Track points: tail first, then head, then far past the edge.
  const pts = [...arrow.cells].reverse().map(([r, c]) => `${center(c)},${center(r)}`);
  pts.push(`${center(hc + dc * exitCells)},${center(hr + dr * exitCells)}`);
  const body = (arrow.cells.length - 1) * cell;
  const track = body + exitCells * cell;

  // Arrowhead rides straight ahead of the head cell.
  const x = center(hc) + dc * t;
  const y = center(hr) + dr * t;
  const s = cell * 0.32;
  const head = [
    [x + dc * s, y + dr * s],
    [x - dc * s * 0.4 - dr * s * 0.8, y - dr * s * 0.4 + dc * s * 0.8],
    [x - dc * s * 0.4 + dr * s * 0.8, y - dr * s * 0.4 - dc * s * 0.8],
  ]
    .map(p => p.join(','))
    .join(' ');

  const color = hurt ? colors.danger : hinted ? colors.accent : colors.ink;
  const stroke = Math.max(2, cell * 0.12);

  return (
    <G>
      <Path
        d={`M${pts.join(' L')}`}
        fill="none"
        stroke={color}
        strokeWidth={hinted ? stroke * 1.5 : stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={[body, track + body + cell]}
        strokeDashoffset={-t}
      />
      <Polygon points={head} fill={color} />
    </G>
  );
});
