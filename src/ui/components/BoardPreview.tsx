import React, { memo } from 'react';
import Svg from 'react-native-svg';
import { Level } from '../../domain/types';
import { ArrowPiece } from './ArrowPiece';

/** Static thumbnail of a real board: shows exactly what the player will get. */
export const BoardPreview = memo(function BoardPreviewView({ level, size }: { level: Level; size: number }) {
  const cell = size / level.size;
  return (
    <Svg width={size} height={size} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {level.arrows.map(a => (
        <ArrowPiece key={a.id} arrow={a} cell={cell} size={level.size} />
      ))}
    </Svg>
  );
});
