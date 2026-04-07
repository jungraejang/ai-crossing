import { DEFAULT_ISO_CONFIG } from './isometric';
import { getBuildingAssetPath, getDecorationAssetPath } from './isometricAssets';

const W = 60;
const H = 48;

interface BuildingDef {
  x: number;
  y: number;
  w: number;
  h: number;
  openInterior?: boolean;
}

interface IsoRenderAnchor {
  x: number;
  y: number;
}

interface IsoFootprint {
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
}

interface IsoRenderConfig {
  assetPath: string;
  anchor: IsoRenderAnchor;
  footprint: IsoFootprint;
  elevation?: number;
  sortOffset?: number;
  tint?: number;
  roofFadeWhenOccupied?: boolean;
}

const BUILDING_DEFS: BuildingDef[] = [
  { x: 4, y: 3, w: 4, h: 3, openInterior: true },     // Home 1
  { x: 16, y: 3, w: 4, h: 3, openInterior: true },    // Home 2
  { x: 40, y: 3, w: 4, h: 3, openInterior: true },    // Workshop
  { x: 6, y: 18, w: 4, h: 3, openInterior: true },    // Garden — fully open
  { x: 42, y: 18, w: 4, h: 3, openInterior: true },   // Store
  { x: 4, y: 28, w: 4, h: 3, openInterior: true },    // Home 3
  { x: 18, y: 28, w: 4, h: 3, openInterior: true },   // Café
  { x: 32, y: 28, w: 4, h: 3, openInterior: true },   // Home 4
  { x: 46, y: 28, w: 4, h: 3, openInterior: true },   // Home 5
  { x: 28, y: 3, w: 4, h: 3, openInterior: true },    // Home 6
  { x: 52, y: 3, w: 4, h: 3, openInterior: true },    // Home 7
  { x: 52, y: 18, w: 4, h: 3, openInterior: true },   // Home 8
  { x: 16, y: 11, w: 4, h: 3, openInterior: true },   // Home 9
  { x: 28, y: 11, w: 4, h: 3, openInterior: true },   // Home 10
  { x: 16, y: 36, w: 4, h: 3, openInterior: true },   // Home 11
  { x: 38, y: 36, w: 4, h: 3, openInterior: true },   // Home 12
];

function generateCollision(): number[][] {
  const grid: number[][] = [];
  for (let y = 0; y < H; y++) {
    const row: number[] = [];
    for (let x = 0; x < W; x++) {
      row.push(0);
    }
    grid.push(row);
  }

  for (const b of BUILDING_DEFS) {
    for (let by = b.y; by < b.y + b.h; by++) {
      for (let bx = b.x; bx < b.x + b.w; bx++) {
        if (by < 0 || by >= H || bx < 0 || bx >= W) continue;

        const isTopWall = by === b.y;
        const isBottomWall = by === b.y + b.h - 1;
        const isLeftWall = bx === b.x;
        const isRightWall = bx === b.x + b.w - 1;
        const isWall = isTopWall || isBottomWall || isLeftWall || isRightWall;
        const isInterior = !isWall;

        if (b.openInterior && isInterior) {
          grid[by]![bx] = 0;
        } else if (isInterior) {
          grid[by]![bx] = 1;
        } else {
          grid[by]![bx] = 1;
        }
      }
    }

    if (b.openInterior) {
      const doorX = b.x + Math.floor(b.w / 2);
      const doorBottomY = b.y + b.h - 1;
      const doorTopY = b.y;
      if (doorBottomY < H) grid[doorBottomY]![doorX] = 0;
      if (doorX + 1 < b.x + b.w) {
        if (doorBottomY < H) grid[doorBottomY]![doorX + 1] = 0;
      }
      if (doorTopY >= 0) grid[doorTopY]![doorX] = 0;
      if (doorX + 1 < b.x + b.w) {
        if (doorTopY >= 0) grid[doorTopY]![doorX + 1] = 0;
      }
    }
  }

  // Lake area (bottom)
  for (let x = 8; x < 52; x++) {
    for (let y = 42; y < 47; y++) {
      if (x >= 28 && x <= 31 && y === 42) continue; // Bridge
      grid[y]![x] = 1;
    }
  }

  return grid;
}

export type TerrainType = 'grass' | 'water' | 'dirt' | 'cobble' | 'bridge';

function paintDirtLine(grid: TerrainType[][], x1: number, y1: number, x2: number, y2: number): void {
  if (y1 === y2) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    for (let x = minX; x <= maxX; x++) {
      if (y1 >= 0 && y1 < H && x >= 0 && x < W && grid[y1]![x] === 'grass') {
        grid[y1]![x] = 'dirt';
      }
    }
  } else if (x1 === x2) {
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    for (let y = minY; y <= maxY; y++) {
      if (y >= 0 && y < H && x1 >= 0 && x1 < W && grid[y]![x1] === 'grass') {
        grid[y]![x1] = 'dirt';
      }
    }
  }
}

function generateTerrainGrid(): TerrainType[][] {
  const grid: TerrainType[][] = [];
  for (let y = 0; y < H; y++) {
    grid[y] = [];
    for (let x = 0; x < W; x++) {
      grid[y]![x] = 'grass';
    }
  }

  // Main horizontal paths
  paintDirtLine(grid, 6, 8, 55, 8);     // Top road
  paintDirtLine(grid, 10, 16, 55, 16);  // Civic road
  paintDirtLine(grid, 6, 25, 55, 25);   // Residential road
  paintDirtLine(grid, 10, 33, 48, 33);  // Lower homes road
  paintDirtLine(grid, 20, 41, 40, 41);  // Lakefront road

  // Main vertical roads
  paintDirtLine(grid, 10, 8, 10, 25);
  paintDirtLine(grid, 24, 8, 24, 33);
  paintDirtLine(grid, 30, 16, 30, 41);
  paintDirtLine(grid, 38, 8, 38, 41);
  paintDirtLine(grid, 52, 8, 52, 25);

  // Connectors from top row buildings
  paintDirtLine(grid, 6, 6, 6, 8);      // Home 1
  paintDirtLine(grid, 18, 6, 18, 8);    // Home 2
  paintDirtLine(grid, 30, 6, 30, 8);    // Home 6
  paintDirtLine(grid, 42, 6, 42, 8);    // Workshop
  paintDirtLine(grid, 54, 6, 54, 8);    // Home 7

  // Connectors from middle-top homes
  paintDirtLine(grid, 18, 8, 18, 11);   // Home 9 top
  paintDirtLine(grid, 18, 14, 18, 16);  // Home 9 bottom
  paintDirtLine(grid, 30, 8, 30, 11);   // Home 10 top
  paintDirtLine(grid, 30, 14, 30, 16);  // Home 10 bottom

  // Connectors from civic row
  paintDirtLine(grid, 8, 16, 8, 18);    // Garden top
  paintDirtLine(grid, 8, 21, 8, 25);    // Garden bottom
  paintDirtLine(grid, 29, 16, 29, 18);  // Town square top
  paintDirtLine(grid, 29, 22, 29, 25);  // Town square bottom
  paintDirtLine(grid, 44, 16, 44, 18);  // Store top
  paintDirtLine(grid, 44, 21, 44, 25);  // Store bottom
  paintDirtLine(grid, 54, 16, 54, 18);  // Home 8 top
  paintDirtLine(grid, 54, 21, 54, 25);  // Home 8 bottom

  // Connectors from residential row
  paintDirtLine(grid, 6, 25, 6, 28);    // Home 3
  paintDirtLine(grid, 20, 25, 20, 28);  // Café
  paintDirtLine(grid, 34, 25, 34, 28);  // Home 4
  paintDirtLine(grid, 48, 25, 48, 28);  // Home 5

  // Connectors from lower homes and bridge approach
  paintDirtLine(grid, 18, 33, 18, 36);  // Home 11
  paintDirtLine(grid, 40, 33, 40, 36);  // Home 12
  paintDirtLine(grid, 30, 33, 30, 41);  // Bridge approach

  // Water
  for (let x = 8; x < 52; x++) {
    for (let y = 42; y < 47; y++) {
      if (x >= 28 && x <= 31 && y === 42) {
        grid[y]![x] = 'bridge';
      } else {
        grid[y]![x] = 'water';
      }
    }
  }

  // Town square cobblestone
  const townSquare = { x: 25, y: 18, w: 8, h: 5 };
  for (let by = townSquare.y; by < townSquare.y + townSquare.h; by++) {
    for (let bx = townSquare.x; bx < townSquare.x + townSquare.w; bx++) {
      if (by >= 0 && by < H && bx >= 0 && bx < W) grid[by]![bx] = 'cobble';
    }
  }

  // Buildings
  for (const b of BUILDING_DEFS) {
    for (let by = b.y; by < b.y + b.h; by++) {
      for (let bx = b.x; bx < b.x + b.w; bx++) {
        if (by >= 0 && by < H && bx >= 0 && bx < W) grid[by]![bx] = 'cobble';
      }
    }
  }

  return grid;
}

function generateGroundTiles(): number[] {
  const tiles: number[] = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (y >= 42 && y < 47 && x >= 8 && x < 52) {
        if (x >= 28 && x <= 31 && y === 42) {
          tiles.push(4);
        } else {
          tiles.push(3);
        }
      } else {
        tiles.push(Math.random() > 0.85 ? 2 : 1);
      }
    }
  }
  return tiles;
}

export interface MapDecoration {
  id: string;
  sprite: string;
  x: number;
  y: number;
  w: number;
  h: number;
  render: IsoRenderConfig;
}

export interface MapBuilding {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: number;
  render: IsoRenderConfig;
}

function createDecoration(
  id: string,
  sprite: string,
  x: number,
  y: number,
  w: number,
  h: number,
  tint?: number,
): MapDecoration {
  return {
    id,
    sprite,
    x,
    y,
    w,
    h,
    render: {
      assetPath: getDecorationAssetPath(sprite),
      anchor: { x: 0.5, y: 1 },
      footprint: { width: Math.max(1, Math.round(w)), height: Math.max(1, Math.round(h)) },
      sortOffset: Math.round(h * 10),
      tint,
    },
  };
}

function createBuilding(
  id: string,
  label: string,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number,
): MapBuilding {
  return {
    id,
    label,
    x,
    y,
    w,
    h,
    color,
    render: {
      assetPath: getBuildingAssetPath(id),
      anchor: { x: 0.5, y: 1 },
      footprint: { width: w, height: h },
      elevation: Math.max(2, h),
      roofFadeWhenOccupied: true,
      sortOffset: h * 25,
      tint: color,
    },
  };
}

const DECORATIONS: MapDecoration[] = [
  // Trees scattered around empty grass
  createDecoration('d1', 'oak_tree', 1, 1, 2, 2, 0x5b8c51),
  createDecoration('d2', 'pine_tree', 9, 2, 1.5, 2, 0x49703f),
  createDecoration('d3', 'cherry_tree', 17, 1, 2, 2, 0xc97ca6),
  createDecoration('d4', 'oak_tree', 25, 1, 2, 2, 0x5b8c51),
  createDecoration('d5', 'pine_tree', 57, 9, 1.5, 2, 0x49703f),
  createDecoration('d6', 'cherry_tree', 1, 9, 2, 2, 0xc97ca6),
  createDecoration('d7', 'oak_tree', 1, 14, 2, 2, 0x5b8c51),
  createDecoration('d8', 'pine_tree', 57, 24, 1.5, 2, 0x49703f),
  createDecoration('d9', 'cherry_tree', 10, 31, 2, 2, 0xc97ca6),
  createDecoration('d10', 'oak_tree', 56, 31, 2, 2, 0x5b8c51),
  createDecoration('d11', 'pine_tree', 2, 35, 1.5, 2, 0x49703f),
  createDecoration('d12', 'oak_tree', 56, 37, 2, 2, 0x5b8c51),

  // Bushes between buildings
  createDecoration('d13', 'bush', 9, 4, 1, 1, 0x4f8a4a),
  createDecoration('d14', 'bush', 18, 5, 1, 1, 0x4f8a4a),
  createDecoration('d15', 'bush', 31, 4, 1, 1, 0x4f8a4a),
  createDecoration('d16', 'bush', 12, 13, 1, 1, 0x4f8a4a),
  createDecoration('d17', 'bush', 36, 23, 1, 1, 0x4f8a4a),
  createDecoration('d18', 'bush', 10, 31, 1, 1, 0x4f8a4a),
  createDecoration('d19', 'bush', 24, 31, 1, 1, 0x4f8a4a),

  // Flower patches
  createDecoration('d20', 'flowers', 3, 9, 1, 1, 0xf3b6cf),
  createDecoration('d21', 'flowers', 15, 9, 1, 1, 0xf3b6cf),
  createDecoration('d22', 'flowers', 35, 12, 1, 1, 0xf3b6cf),
  createDecoration('d23', 'flowers', 22, 23, 1, 1, 0xf3b6cf),
  createDecoration('d24', 'flowers', 34, 23, 1, 1, 0xf3b6cf),
  createDecoration('d25', 'flowers', 47, 13, 1, 1, 0xf3b6cf),
  createDecoration('d26', 'flowers', 3, 16, 1, 1, 0xf3b6cf),

  // Rocks
  createDecoration('d27', 'small_rocks', 14, 14, 1, 1, 0x8b8f98),
  createDecoration('d28', 'small_rocks', 42, 9, 1, 1, 0x8b8f98),
  createDecoration('d29', 'small_rocks', 4, 39, 1, 1, 0x8b8f98),
  createDecoration('d30', 'small_rocks', 54, 39, 1, 1, 0x8b8f98),

  // Benches along paths near town square
  createDecoration('d31', 'bench', 24, 17, 1.5, 1, 0x8b6b43),
  createDecoration('d32', 'bench', 33, 17, 1.5, 1, 0x8b6b43),
  createDecoration('d33', 'bench', 26, 24, 1.5, 1, 0x8b6b43),

  // Lake shore reeds
  createDecoration('d34', 'reeds', 9, 41, 1, 1, 0x9bb56d),
  createDecoration('d35', 'reeds', 13, 41, 1, 1, 0x9bb56d),
  createDecoration('d36', 'reeds', 18, 41, 1, 1, 0x9bb56d),
  createDecoration('d37', 'reeds', 23, 41, 1, 1, 0x9bb56d),
  createDecoration('d38', 'reeds', 37, 41, 1, 1, 0x9bb56d),
  createDecoration('d39', 'reeds', 42, 41, 1, 1, 0x9bb56d),
  createDecoration('d40', 'reeds', 47, 41, 1, 1, 0x9bb56d),
  createDecoration('d41', 'reeds', 50, 41, 1, 1, 0x9bb56d),

  // More small rocks at lake shore
  createDecoration('d42', 'small_rocks', 12, 41, 1, 1, 0x8b8f98),
  createDecoration('d43', 'small_rocks', 20, 41, 1, 1, 0x8b8f98),
  createDecoration('d44', 'small_rocks', 39, 41, 1, 1, 0x8b8f98),
  createDecoration('d45', 'small_rocks', 46, 41, 1, 1, 0x8b8f98),
];

export const MAP_DATA = {
  width: W,
  height: H,
  tileSize: 32,
  projection: {
    mode: 'isometric' as const,
    logicalTileSize: 32,
    ...DEFAULT_ISO_CONFIG,
  },
  collision: generateCollision(),
  groundTiles: generateGroundTiles(),
  terrainGrid: generateTerrainGrid(),
  decorations: DECORATIONS,
  buildings: [
    createBuilding('home_1', 'Home 1', 4, 3, 4, 3, 0x8b4513),
    createBuilding('home_2', 'Home 2', 16, 3, 4, 3, 0xa0522d),
    createBuilding('workshop', 'Workshop', 40, 3, 4, 3, 0x808080),
    createBuilding('garden', 'Garden', 6, 18, 4, 3, 0x228b22),
    createBuilding('town_square', 'Town Square', 25, 18, 8, 5, 0xdaa520),
    createBuilding('store', 'Store', 42, 18, 4, 3, 0x4169e1),
    createBuilding('home_3', 'Home 3', 4, 28, 4, 3, 0xcd853f),
    createBuilding('cafe', 'Café', 18, 28, 4, 3, 0xb22222),
    createBuilding('home_4', 'Home 4', 32, 28, 4, 3, 0xd2691e),
    createBuilding('home_5', 'Home 5', 46, 28, 4, 3, 0x8fbc8f),
    createBuilding('home_6', 'Home 6', 28, 3, 4, 3, 0x6a5acd),
    createBuilding('home_7', 'Home 7', 52, 3, 4, 3, 0xbc8f8f),
    createBuilding('home_8', 'Home 8', 52, 18, 4, 3, 0x5f9ea0),
    createBuilding('home_9', 'Home 9', 16, 11, 4, 3, 0xc0392b),
    createBuilding('home_10', 'Home 10', 28, 11, 4, 3, 0x2e86c1),
    createBuilding('home_11', 'Home 11', 16, 36, 4, 3, 0xd4ac0d),
    createBuilding('home_12', 'Home 12', 38, 36, 4, 3, 0x7d8c8e),
  ] as MapBuilding[],
};
