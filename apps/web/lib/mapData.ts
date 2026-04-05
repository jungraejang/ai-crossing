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

function generateGroundTiles(): number[] {
  const tiles: number[] = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (y >= 25 && y < 29 && x >= 5 && x < 35) {
        if (x >= 18 && x <= 22 && y === 25) {
          tiles.push(4); // Bridge
        } else {
          tiles.push(3); // Water
        }
      } else {
        tiles.push(Math.random() > 0.85 ? 2 : 1); // Grass variations
      }
    }
  }
  return tiles;
}

export const MAP_DATA = {
  width: W,
  height: H,
  tileSize: 32,
  collision: generateCollision(),
  groundTiles: generateGroundTiles(),
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
  ],
};
