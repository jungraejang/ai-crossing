import type { Direction } from '@ai-crossing/shared';

type DirectionFrameCounts = Partial<Record<Direction, number>>;

const EIGHT_DIRECTION_WALK: DirectionFrameCounts = {
  north: 8,
  northEast: 8,
  east: 8,
  southEast: 8,
  south: 8,
  southWest: 8,
  west: 8,
  northWest: 8,
};

export const VILLAGER_WALK_ANIMATION_MANIFEST: Partial<Record<string, DirectionFrameCounts>> = {
  maple: EIGHT_DIRECTION_WALK,
  jasper: EIGHT_DIRECTION_WALK,
  luna: EIGHT_DIRECTION_WALK,
  rowan: EIGHT_DIRECTION_WALK,
  sage: EIGHT_DIRECTION_WALK,
  felix: EIGHT_DIRECTION_WALK,
  coral: EIGHT_DIRECTION_WALK,
  finn: EIGHT_DIRECTION_WALK,
  ivy: EIGHT_DIRECTION_WALK,
  milo: EIGHT_DIRECTION_WALK,
  pearl: EIGHT_DIRECTION_WALK,
  otto: EIGHT_DIRECTION_WALK,
  hazel: EIGHT_DIRECTION_WALK,
  cliff: EIGHT_DIRECTION_WALK,
  wren: EIGHT_DIRECTION_WALK,
  birch: EIGHT_DIRECTION_WALK,
  ember: EIGHT_DIRECTION_WALK,
  fern: EIGHT_DIRECTION_WALK,
  slate: EIGHT_DIRECTION_WALK,
  poppy: EIGHT_DIRECTION_WALK,
  reed: EIGHT_DIRECTION_WALK,
  dusk: EIGHT_DIRECTION_WALK,
  cinder: EIGHT_DIRECTION_WALK,
  flint: EIGHT_DIRECTION_WALK,
};
