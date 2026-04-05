import type { VillagerState, Direction } from '@ai-crossing/shared';
import { MOVEMENT_SPEED_TILES_PER_SECOND } from '@ai-crossing/shared';
import { findPath } from '@ai-crossing/simulation';

export function updateMovement(state: VillagerState, dt: number): VillagerState {
  if (state.path.length === 0) return state;

  const speed = MOVEMENT_SPEED_TILES_PER_SECOND * dt;
  const next = state.path[0]!;
  const dx = next.x - state.x;
  const dy = next.y - state.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  let facing: Direction = state.facing;
  if (Math.abs(dx) > Math.abs(dy)) {
    facing = dx > 0 ? 'right' : 'left';
  } else if (dy !== 0) {
    facing = dy > 0 ? 'down' : 'up';
  }

  if (dist <= speed) {
    const remaining = state.path.slice(1);
    const arrived = remaining.length === 0;

    return {
      ...state,
      x: next.x,
      y: next.y,
      facing,
      path: remaining,
      isMoving: !arrived,
      currentLocation: arrived ? (state.targetDestination ?? state.currentLocation) : state.currentLocation,
      targetDestination: arrived ? null : state.targetDestination,
    };
  }

  return {
    ...state,
    x: state.x + (dx / dist) * speed,
    y: state.y + (dy / dist) * speed,
    facing,
    isMoving: true,
  };
}

export function planPath(
  state: VillagerState,
  targetX: number,
  targetY: number,
): VillagerState {
  const path = findPath(Math.round(state.x), Math.round(state.y), targetX, targetY);

  if (path.length <= 1) return state;

  return {
    ...state,
    path: path.slice(1),
    isMoving: true,
  };
}
