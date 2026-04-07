export interface IsoProjectionConfig {
  tileWidth: number;
  tileHeight: number;
  elevationStep: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface GridPoint {
  x: number;
  y: number;
}

export interface IsoBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}

export const DEFAULT_ISO_CONFIG: IsoProjectionConfig = {
  tileWidth: 64,
  tileHeight: 32,
  elevationStep: 16,
};

export function gridToScreen(
  x: number,
  y: number,
  config: IsoProjectionConfig = DEFAULT_ISO_CONFIG,
  elevation = 0,
): ScreenPoint {
  return {
    x: (x - y) * (config.tileWidth / 2),
    y: (x + y) * (config.tileHeight / 2) - elevation * config.elevationStep,
  };
}

export function screenToGrid(
  x: number,
  y: number,
  config: IsoProjectionConfig = DEFAULT_ISO_CONFIG,
): GridPoint {
  return {
    x: x / config.tileWidth + y / config.tileHeight,
    y: y / config.tileHeight - x / config.tileWidth,
  };
}

export function getDepthSortKey(
  x: number,
  y: number,
  elevation = 0,
  sortOffset = 0,
): number {
  return (x + y) * 1000 - elevation * 100 + sortOffset;
}

export function getProjectedMapBounds(
  width: number,
  height: number,
  config: IsoProjectionConfig = DEFAULT_ISO_CONFIG,
): IsoBounds {
  const corners = [
    gridToScreen(0, 0, config),
    gridToScreen(width, 0, config),
    gridToScreen(0, height, config),
    gridToScreen(width, height, config),
  ];

  const xs = corners.map((point) => point.x);
  const ys = corners.map((point) => point.y);
  const minX = Math.min(...xs) - config.tileWidth / 2;
  const maxX = Math.max(...xs) + config.tileWidth / 2;
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys) + config.tileHeight;

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function getIsoDiamondPoints(
  x: number,
  y: number,
  config: IsoProjectionConfig = DEFAULT_ISO_CONFIG,
): Array<[number, number]> {
  const halfWidth = config.tileWidth / 2;
  const halfHeight = config.tileHeight / 2;

  return [
    [x, y - halfHeight],
    [x + halfWidth, y],
    [x, y + halfHeight],
    [x - halfWidth, y],
  ];
}

export function getFootprintCenter(
  tileX: number,
  tileY: number,
  config: IsoProjectionConfig = DEFAULT_ISO_CONFIG,
  elevation = 0,
): ScreenPoint {
  return gridToScreen(tileX + 0.5, tileY + 0.5, config, elevation);
}
