import { Assets, type Texture } from 'pixi.js';
import type { Direction } from '@ai-crossing/shared';
import type { MapBuilding, MapDecoration, TerrainType } from './mapData';
import { VILLAGER_WALK_ANIMATION_MANIFEST } from './walkAnimationManifest';

export const ISO_DIRECTION_ASSET_NAMES: Record<Direction, string> = {
  north: 'north',
  northEast: 'north_east',
  east: 'east',
  southEast: 'south_east',
  south: 'south',
  southWest: 'south_west',
  west: 'west',
  northWest: 'north_west',
};

export interface VillagerTextureSet {
  idle: Partial<Record<Direction, Texture>>;
  walk: Partial<Record<Direction, Texture[]>>;
}

export interface IsometricAssetBundle {
  terrain: Partial<Record<TerrainType, Texture>>;
  buildings: Record<string, Texture>;
  decorations: Record<string, Texture>;
  villagers: Record<string, VillagerTextureSet>;
}

const TERRAIN_ASSET_PATHS: Record<TerrainType, string> = {
  grass: '/isometric/terrain/grass.svg',
  water: '/isometric/terrain/water.svg',
  dirt: '/isometric/terrain/dirt.svg',
  cobble: '/isometric/terrain/cobble.svg',
  bridge: '/isometric/terrain/bridge.svg',
};

let cachedAssets: IsometricAssetBundle | null = null;

function getAssetCandidates(path: string, allowSvgFallback = true): string[] {
  const lastDot = path.lastIndexOf('.');
  if (lastDot === -1) return [path];

  const stem = path.slice(0, lastDot);
  const ext = path.slice(lastDot + 1);
  if (ext === 'png') return allowSvgFallback ? [path, `${stem}.svg`] : [path];
  if (ext === 'svg') return [path, `${stem}.png`];
  return [path];
}

async function tryLoadTexture(path: string, allowSvgFallback = true): Promise<Texture | null> {
  for (const candidate of getAssetCandidates(path, allowSvgFallback)) {
    try {
      return await Assets.load(candidate);
    } catch {
      // Try the next extension candidate.
    }
  }

  return null;
}

export function getTerrainAssetPath(terrainType: TerrainType): string {
  return TERRAIN_ASSET_PATHS[terrainType];
}

export function getBuildingAssetPath(buildingId: string): string {
  return `/isometric/buildings/${buildingId}.png`;
}

export function getDecorationAssetPath(spriteName: string): string {
  return `/isometric/decorations/${spriteName}.png`;
}

export function getVillagerDirectionalAssetPath(villagerId: string, assetName: string): string {
  return `/isometric/villagers/${villagerId}/${assetName}.png`;
}

export function getVillagerWalkFrameAssetPath(
  villagerId: string,
  assetName: string,
  frameIndex: number,
): string {
  return `/isometric/villagers/${villagerId}/walk/${assetName}/frame_${String(frameIndex).padStart(3, '0')}.png`;
}

async function loadWalkFrames(
  villagerId: string,
  direction: Direction,
  directionName: string,
): Promise<Texture[]> {
  const frames: Texture[] = [];
  const frameCount = VILLAGER_WALK_ANIMATION_MANIFEST[villagerId]?.[direction] ?? 0;
  if (frameCount === 0) {
    return frames;
  }

  for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
    const texture = await tryLoadTexture(
      getVillagerWalkFrameAssetPath(villagerId, directionName, frameIndex),
      false,
    );
    if (!texture) {
      return [];
    }
    frames.push(texture);
  }

  return frames;
}

export async function loadIsometricAssets(
  villagerIds: string[],
  buildings: MapBuilding[],
  decorations: MapDecoration[],
): Promise<IsometricAssetBundle> {
  if (cachedAssets) {
    return cachedAssets;
  }

  const terrain: Partial<Record<TerrainType, Texture>> = {};
  const buildingTextures: Record<string, Texture> = {};
  const decorationTextures: Record<string, Texture> = {};
  const villagerTextures: Record<string, VillagerTextureSet> = {};

  await Promise.all(
    (Object.entries(TERRAIN_ASSET_PATHS) as Array<[TerrainType, string]>).map(async ([terrainType, path]) => {
      const texture = await tryLoadTexture(path);
      if (texture) terrain[terrainType] = texture;
    }),
  );

  await Promise.all(
    buildings.map(async (building) => {
      const texture = await tryLoadTexture(building.render.assetPath);
      if (texture) buildingTextures[building.id] = texture;
    }),
  );

  await Promise.all(
    decorations.map(async (decoration) => {
      const texture = await tryLoadTexture(decoration.render.assetPath);
      if (texture) decorationTextures[decoration.id] = texture;
    }),
  );

  await Promise.all(
    villagerIds.flatMap((villagerId) =>
      (Object.entries(ISO_DIRECTION_ASSET_NAMES) as Array<[Direction, string]>).map(async ([direction, assetName]) => {
        if (!villagerTextures[villagerId]) {
          villagerTextures[villagerId] = { idle: {}, walk: {} };
        }

        const texture = await tryLoadTexture(getVillagerDirectionalAssetPath(villagerId, assetName));
        if (texture) {
          villagerTextures[villagerId].idle[direction] = texture;
        }

        const walkFrames = await loadWalkFrames(villagerId, direction, assetName);
        if (walkFrames.length > 0) {
          villagerTextures[villagerId].walk[direction] = walkFrames;
        }
      }),
    ),
  );

  cachedAssets = {
    terrain,
    buildings: buildingTextures,
    decorations: decorationTextures,
    villagers: villagerTextures,
  };

  return cachedAssets;
}
