const W = 40;
const H = 30;

interface BuildingDef {
  x: number;
  y: number;
  w: number;
  h: number;
  openInterior?: boolean;
}

const BUILDING_DEFS: BuildingDef[] = [
  { x: 4, y: 3, w: 4, h: 3, openInterior: true },     // Home 1
  { x: 12, y: 3, w: 4, h: 3, openInterior: true },    // Home 2
  { x: 26, y: 3, w: 4, h: 3, openInterior: true },    // Workshop
  { x: 6, y: 12, w: 4, h: 3, openInterior: true },    // Garden — fully open
  { x: 26, y: 12, w: 4, h: 3, openInterior: true },   // Store
  { x: 4, y: 18, w: 4, h: 3, openInterior: true },    // Home 3
  { x: 13, y: 18, w: 4, h: 3, openInterior: true },   // Café
  { x: 22, y: 18, w: 4, h: 3, openInterior: true },   // Home 4
  { x: 30, y: 18, w: 4, h: 3, openInterior: true },   // Home 5
  { x: 20, y: 3, w: 4, h: 3, openInterior: true },    // Home 6
  { x: 34, y: 3, w: 4, h: 3, openInterior: true },    // Home 7
  { x: 34, y: 12, w: 4, h: 3, openInterior: true },   // Home 8
  { x: 12, y: 8, w: 4, h: 3, openInterior: true },    // Home 9
  { x: 20, y: 8, w: 4, h: 3, openInterior: true },    // Home 10
  { x: 12, y: 22, w: 4, h: 3, openInterior: true },   // Home 11
  { x: 28, y: 22, w: 4, h: 3, openInterior: true },   // Home 12
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
  for (let x = 5; x < 35; x++) {
    for (let y = 25; y < 29; y++) {
      if (x >= 18 && x <= 22 && y === 25) continue; // Bridge
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

  // Main horizontal path (1 tile wide) connecting rows
  paintDirtLine(grid, 6, 7, 36, 7);     // Top path
  paintDirtLine(grid, 6, 11, 36, 11);   // Middle path
  paintDirtLine(grid, 6, 17, 36, 17);   // Bottom path
  paintDirtLine(grid, 18, 23, 22, 23);  // Bridge approach

  // Main vertical path connecting horizontal paths
  paintDirtLine(grid, 11, 7, 11, 17);   // West vertical
  paintDirtLine(grid, 20, 7, 20, 23);   // Center vertical
  paintDirtLine(grid, 33, 7, 33, 17);   // East vertical

  // Connectors from top row buildings down to top path
  paintDirtLine(grid, 6, 6, 6, 7);      // Home 1
  paintDirtLine(grid, 14, 6, 14, 7);    // Home 2
  paintDirtLine(grid, 22, 6, 22, 7);    // Home 6
  paintDirtLine(grid, 28, 6, 28, 7);    // Workshop
  paintDirtLine(grid, 36, 6, 36, 7);    // Home 7

  // Connectors from middle row buildings to middle path
  paintDirtLine(grid, 8, 11, 8, 12);    // Garden
  paintDirtLine(grid, 20, 11, 20, 12);  // Town Square top
  paintDirtLine(grid, 20, 16, 20, 17);  // Town Square bottom
  paintDirtLine(grid, 28, 11, 28, 12);  // Store
  paintDirtLine(grid, 36, 11, 36, 12);  // Home 8

  // Connectors from new homes (y=8 row) to horizontal paths
  paintDirtLine(grid, 14, 7, 14, 8);    // Home 9 top
  paintDirtLine(grid, 14, 11, 14, 10);  // Home 9 bottom
  paintDirtLine(grid, 22, 7, 22, 8);    // Home 10 top
  paintDirtLine(grid, 22, 11, 22, 10);  // Home 10 bottom

  // Connectors from bottom row buildings up to bottom path
  paintDirtLine(grid, 6, 17, 6, 18);    // Home 3
  paintDirtLine(grid, 15, 17, 15, 18);  // Café
  paintDirtLine(grid, 24, 17, 24, 18);  // Home 4
  paintDirtLine(grid, 32, 17, 32, 18);  // Home 5

  // Connectors for lower new homes (y=22 row) to bottom path and bridge approach
  paintDirtLine(grid, 6, 22, 38, 22);   // Bottom horizontal path
  paintDirtLine(grid, 14, 17, 14, 22);  // Home 11 connector
  paintDirtLine(grid, 30, 17, 30, 22);  // Home 12 connector

  // Water
  for (let x = 5; x < 35; x++) {
    for (let y = 25; y < 29; y++) {
      if (x >= 18 && x <= 22 && y === 25) {
        grid[y]![x] = 'bridge';
      } else {
        grid[y]![x] = 'water';
      }
    }
  }

  // Town square cobblestone
  const townSquare = { x: 17, y: 12, w: 6, h: 4 };
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
      if (y >= 25 && y < 29 && x >= 5 && x < 35) {
        if (x >= 18 && x <= 22 && y === 25) {
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
}

const DECORATIONS: MapDecoration[] = [
  // Trees scattered around empty grass
  { id: 'd1', sprite: 'oak_tree', x: 1, y: 1, w: 2, h: 2 },
  { id: 'd2', sprite: 'pine_tree', x: 9, y: 2, w: 1.5, h: 2 },
  { id: 'd3', sprite: 'cherry_tree', x: 17, y: 1, w: 2, h: 2 },
  { id: 'd4', sprite: 'oak_tree', x: 25, y: 1, w: 2, h: 2 },
  { id: 'd5', sprite: 'pine_tree', x: 38, y: 8, w: 1.5, h: 2 },
  { id: 'd6', sprite: 'cherry_tree', x: 1, y: 9, w: 2, h: 2 },
  { id: 'd7', sprite: 'oak_tree', x: 1, y: 14, w: 2, h: 2 },
  { id: 'd8', sprite: 'pine_tree', x: 38, y: 14, w: 1.5, h: 2 },
  { id: 'd9', sprite: 'cherry_tree', x: 10, y: 19, w: 2, h: 2 },
  { id: 'd10', sprite: 'oak_tree', x: 27, y: 19, w: 2, h: 2 },
  { id: 'd11', sprite: 'pine_tree', x: 1, y: 21, w: 1.5, h: 2 },
  { id: 'd12', sprite: 'oak_tree', x: 37, y: 20, w: 2, h: 2 },

  // Bushes between buildings
  { id: 'd13', sprite: 'bush', x: 9, y: 4, w: 1, h: 1 },
  { id: 'd14', sprite: 'bush', x: 18, y: 5, w: 1, h: 1 },
  { id: 'd15', sprite: 'bush', x: 31, y: 4, w: 1, h: 1 },
  { id: 'd16', sprite: 'bush', x: 12, y: 13, w: 1, h: 1 },
  { id: 'd17', sprite: 'bush', x: 24, y: 13, w: 1, h: 1 },
  { id: 'd18', sprite: 'bush', x: 10, y: 19, w: 1, h: 1 },
  { id: 'd19', sprite: 'bush', x: 19, y: 19, w: 1, h: 1 },

  // Flower patches
  { id: 'd20', sprite: 'flowers', x: 3, y: 9, w: 1, h: 1 },
  { id: 'd21', sprite: 'flowers', x: 15, y: 9, w: 1, h: 1 },
  { id: 'd22', sprite: 'flowers', x: 23, y: 10, w: 1, h: 1 },
  { id: 'd23', sprite: 'flowers', x: 16, y: 15, w: 1, h: 1 },
  { id: 'd24', sprite: 'flowers', x: 22, y: 15, w: 1, h: 1 },
  { id: 'd25', sprite: 'flowers', x: 35, y: 9, w: 1, h: 1 },
  { id: 'd26', sprite: 'flowers', x: 3, y: 16, w: 1, h: 1 },

  // Rocks
  { id: 'd27', sprite: 'small_rocks', x: 14, y: 14, w: 1, h: 1 },
  { id: 'd28', sprite: 'small_rocks', x: 30, y: 9, w: 1, h: 1 },
  { id: 'd29', sprite: 'small_rocks', x: 2, y: 23, w: 1, h: 1 },
  { id: 'd30', sprite: 'small_rocks', x: 36, y: 23, w: 1, h: 1 },

  // Benches along paths near town square
  { id: 'd31', sprite: 'bench', x: 16, y: 11, w: 1.5, h: 1 },
  { id: 'd32', sprite: 'bench', x: 22, y: 11, w: 1.5, h: 1 },
  { id: 'd33', sprite: 'bench', x: 16, y: 16, w: 1.5, h: 1 },

  // Lake shore reeds
  { id: 'd34', sprite: 'reeds', x: 6, y: 24, w: 1, h: 1 },
  { id: 'd35', sprite: 'reeds', x: 9, y: 24, w: 1, h: 1 },
  { id: 'd36', sprite: 'reeds', x: 13, y: 24, w: 1, h: 1 },
  { id: 'd37', sprite: 'reeds', x: 16, y: 24, w: 1, h: 1 },
  { id: 'd38', sprite: 'reeds', x: 24, y: 24, w: 1, h: 1 },
  { id: 'd39', sprite: 'reeds', x: 27, y: 24, w: 1, h: 1 },
  { id: 'd40', sprite: 'reeds', x: 30, y: 24, w: 1, h: 1 },
  { id: 'd41', sprite: 'reeds', x: 33, y: 24, w: 1, h: 1 },

  // More small rocks at lake shore
  { id: 'd42', sprite: 'small_rocks', x: 8, y: 24, w: 1, h: 1 },
  { id: 'd43', sprite: 'small_rocks', x: 15, y: 24, w: 1, h: 1 },
  { id: 'd44', sprite: 'small_rocks', x: 26, y: 24, w: 1, h: 1 },
  { id: 'd45', sprite: 'small_rocks', x: 32, y: 24, w: 1, h: 1 },
];

export const MAP_DATA = {
  width: W,
  height: H,
  tileSize: 32,
  collision: generateCollision(),
  groundTiles: generateGroundTiles(),
  terrainGrid: generateTerrainGrid(),
  decorations: DECORATIONS,
  buildings: [
    { id: 'home_1', label: 'Home 1', x: 4, y: 3, w: 4, h: 3, color: 0x8b4513 },
    { id: 'home_2', label: 'Home 2', x: 12, y: 3, w: 4, h: 3, color: 0xa0522d },
    { id: 'workshop', label: 'Workshop', x: 26, y: 3, w: 4, h: 3, color: 0x808080 },
    { id: 'garden', label: 'Garden', x: 6, y: 12, w: 4, h: 3, color: 0x228b22 },
    { id: 'town_square', label: 'Town Square', x: 17, y: 12, w: 6, h: 4, color: 0xdaa520 },
    { id: 'store', label: 'Store', x: 26, y: 12, w: 4, h: 3, color: 0x4169e1 },
    { id: 'home_3', label: 'Home 3', x: 4, y: 18, w: 4, h: 3, color: 0xcd853f },
    { id: 'cafe', label: 'Café', x: 13, y: 18, w: 4, h: 3, color: 0xb22222 },
    { id: 'home_4', label: 'Home 4', x: 22, y: 18, w: 4, h: 3, color: 0xd2691e },
    { id: 'home_5', label: 'Home 5', x: 30, y: 18, w: 4, h: 3, color: 0x8fbc8f },
    { id: 'home_6', label: 'Home 6', x: 20, y: 3, w: 4, h: 3, color: 0x6a5acd },
    { id: 'home_7', label: 'Home 7', x: 34, y: 3, w: 4, h: 3, color: 0xbc8f8f },
    { id: 'home_8', label: 'Home 8', x: 34, y: 12, w: 4, h: 3, color: 0x5f9ea0 },
    { id: 'home_9', label: 'Home 9', x: 12, y: 8, w: 4, h: 3, color: 0xc0392b },
    { id: 'home_10', label: 'Home 10', x: 20, y: 8, w: 4, h: 3, color: 0x2e86c1 },
    { id: 'home_11', label: 'Home 11', x: 12, y: 22, w: 4, h: 3, color: 0xd4ac0d },
    { id: 'home_12', label: 'Home 12', x: 28, y: 22, w: 4, h: 3, color: 0x7d8c8e },
  ],
};
