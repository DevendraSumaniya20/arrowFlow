import React, { useMemo } from 'react';
import {
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { buildOccupancy, cellKey, freeArrowIds } from '../../domain/board';
import { GameState } from '../../state/gameReducer';
import { usePalette } from '../theme';
import { ArrowPiece } from './ArrowPiece';

interface Props {
  state: GameState;
  onTap: (row: number, col: number) => void;
  onLeft: (id: number) => void;
}

export function Board({ state, onTap, onLeft }: Props) {
  const colors = usePalette();
  const { width, height } = useWindowDimensions();
  const boardPx = Math.min(width - 24, height * 0.6, 600);
  const { size } = state.level;
  const cell = boardPx / size;

  // Dots show through wherever the board has been cleared.
  const dots = useMemo(() => {
    const occ = buildOccupancy(state.arrows);
    const out: { r: number; c: number }[] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!occ.has(cellKey(r, c))) {
          out.push({ r, c });
        }
      }
    }
    return out;
  }, [state.arrows, size]);

  const free = useMemo(() => freeArrowIds(state.arrows, size), [state.arrows, size]);

  // One touch target for the whole board: map the touch point to a cell.
  const handlePress = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    onTap(Math.floor(locationY / cell), Math.floor(locationX / cell));
  };

  return (
    <Pressable
      onPress={handlePress}
      testID="board"
      accessible={false} // let each arrow marker be its own accessible element
      style={[styles.board, { width: boardPx, height: boardPx }]}>
      <Svg width={boardPx} height={boardPx} pointerEvents="none">
        {dots.map(({ r, c }) => (
          <Circle
            key={`${r}-${c}`}
            cx={(c + 0.5) * cell}
            cy={(r + 0.5) * cell}
            r={Math.max(1.5, cell * 0.06)}
            fill={colors.dot}
          />
        ))}
        {state.arrows.map(a => (
          <ArrowPiece
            key={a.id}
            arrow={a}
            cell={cell}
            size={size}
            hinted={a.id === state.hintId}
            bump={state.bump?.id === a.id ? state.bump : null}
          />
        ))}
        {state.leaving.map(a => (
          <ArrowPiece
            key={`out-${a.id}`}
            arrow={a}
            cell={cell}
            size={size}
            leaving
            onLeft={onLeft}
          />
        ))}
      </Svg>
      {/* Head markers: screen readers can activate each arrow, Maestro can find it.
          Touches pass through to the board. testID exposes free/blocked for E2E only. */}
      {state.arrows.map(a => (
        <View
          key={a.id}
          collapsable={false}
          pointerEvents="none"
          testID={free.has(a.id) ? 'arrow-free' : 'arrow-blocked'}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Arrow pointing ${a.dir}`}
          accessibilityActions={[{ name: 'activate' }]}
          onAccessibilityAction={() => onTap(a.cells[0][0], a.cells[0][1])}
          style={[
            styles.marker,
            { left: a.cells[0][1] * cell, top: a.cells[0][0] * cell, width: cell, height: cell },
          ]}
        />
      ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  board: { overflow: 'hidden' },
  marker: { position: 'absolute' },
});
