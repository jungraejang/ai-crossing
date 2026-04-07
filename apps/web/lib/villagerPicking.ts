import type { Villager } from '@ai-crossing/shared';
import { DEFAULT_ISO_CONFIG, getDepthSortKey, getFootprintCenter, type IsoProjectionConfig } from './isometric';

export function pickVillagerAtScreenPoint(
  villagers: Villager[],
  screenX: number,
  screenY: number,
  config: IsoProjectionConfig = DEFAULT_ISO_CONFIG,
): Villager | null {
  type Candidate = {
    villager: Villager;
    depth: number;
    distance: number;
  };

  const candidates = villagers
    .map((villager) => {
      const foot = getFootprintCenter(villager.state.x, villager.state.y, config);
      const dx = Math.abs(screenX - foot.x);
      const dy = screenY - foot.y;
      const withinBounds =
        dx <= config.tileWidth * 0.28 &&
        dy <= config.tileHeight * 0.3 &&
        dy >= -config.tileHeight * 2.1;

      if (!withinBounds) return null;

      return {
        villager,
        depth: getDepthSortKey(villager.state.x, villager.state.y),
        distance: dx + Math.abs(dy),
      };
    })
    .filter((candidate): candidate is Candidate => candidate !== null)
    .sort((a, b) => {
      if (a.depth !== b.depth) return b.depth - a.depth;
      return a.distance - b.distance;
    });

  return candidates[0]?.villager ?? null;
}
