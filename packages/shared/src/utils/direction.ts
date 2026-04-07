import type { Direction } from '../types/villager';

const OCTANT_BOUNDARY = Math.PI / 8;

export function getDirectionFromDelta(
  dx: number,
  dy: number,
  fallback: Direction = 'south',
): Direction {
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
    return fallback;
  }

  const angle = Math.atan2(dy, dx);

  if (angle >= -OCTANT_BOUNDARY && angle < OCTANT_BOUNDARY) return 'east';
  if (angle >= OCTANT_BOUNDARY && angle < 3 * OCTANT_BOUNDARY) return 'southEast';
  if (angle >= 3 * OCTANT_BOUNDARY && angle < 5 * OCTANT_BOUNDARY) return 'south';
  if (angle >= 5 * OCTANT_BOUNDARY && angle < 7 * OCTANT_BOUNDARY) return 'southWest';
  if (angle >= 7 * OCTANT_BOUNDARY || angle < -7 * OCTANT_BOUNDARY) return 'west';
  if (angle >= -7 * OCTANT_BOUNDARY && angle < -5 * OCTANT_BOUNDARY) return 'northWest';
  if (angle >= -5 * OCTANT_BOUNDARY && angle < -3 * OCTANT_BOUNDARY) return 'north';
  return 'northEast';
}
