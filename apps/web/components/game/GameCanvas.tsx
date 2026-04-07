'use client';

import { useEffect, useRef, useState } from 'react';
import { Application, Container, Graphics, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import { ACTION_LABELS, type Direction, type Villager } from '@ai-crossing/shared';
import { initializeGame } from '@/lib/initGame';
import { loadIsometricAssets, type IsometricAssetBundle, type VillagerTextureSet } from '@/lib/isometricAssets';
import {
  DEFAULT_ISO_CONFIG,
  getDepthSortKey,
  getFootprintCenter,
  getProjectedMapBounds,
  gridToScreen,
  screenToGrid,
  type IsoProjectionConfig,
} from '@/lib/isometric';
import { MAP_DATA, type MapBuilding, type MapDecoration, type TerrainType } from '@/lib/mapData';
import { pickVillagerAtScreenPoint } from '@/lib/villagerPicking';
import { useGameStore } from '@/stores/gameStore';
import { useUIStore } from '@/stores/uiStore';

const ISO: IsoProjectionConfig = MAP_DATA.projection ?? DEFAULT_ISO_CONFIG;
const MAP_BOUNDS = getProjectedMapBounds(MAP_DATA.width, MAP_DATA.height, ISO);

const VILLAGER_IDS = [
  'maple', 'jasper', 'luna', 'rowan', 'sage', 'felix',
  'coral', 'finn', 'ivy', 'milo', 'pearl', 'otto',
  'hazel', 'cliff', 'wren', 'birch', 'ember', 'fern',
  'slate', 'poppy', 'reed', 'dusk', 'cinder', 'flint',
];

const VILLAGER_COLORS: Record<string, number> = {
  maple: 0xff8c7a, jasper: 0x73c474, luna: 0xa97dff, rowan: 0xd5904c,
  sage: 0x64c1a3, felix: 0xf1c553, coral: 0xf28ab0, finn: 0x5ea8f6,
  ivy: 0x5ea65b, milo: 0xf4a259, pearl: 0xe5ccff, otto: 0x9097a1,
  hazel: 0xd56a7f, cliff: 0xa57a5a, wren: 0x90d7ff, birch: 0xb8d57d,
  ember: 0xff8f5a, fern: 0x80d177, slate: 0x93a5b2, poppy: 0xff6f6f,
  reed: 0x759d52, dusk: 0x6f77d6, cinder: 0xd9a57d, flint: 0x826d5c,
};

const TERRAIN_COLORS: Record<TerrainType, number> = {
  grass: 0x5d9c59,
  water: 0x4c8ed9,
  dirt: 0xa57a4e,
  cobble: 0xb7a58d,
  bridge: 0x9e7643,
};

const DIRECTION_ROTATIONS: Record<Direction, number> = {
  north: -Math.PI / 2,
  northEast: -Math.PI / 4,
  east: 0,
  southEast: Math.PI / 4,
  south: Math.PI / 2,
  southWest: (3 * Math.PI) / 4,
  west: Math.PI,
  northWest: (-3 * Math.PI) / 4,
};

const WALK_FRAME_DURATION_MS = 140;

const cachedStyles = {
  buildingLabel: new TextStyle({
    fontSize: 10,
    fill: 0xffffff,
    fontFamily: 'monospace',
    dropShadow: { color: 0x000000, distance: 1, alpha: 0.85 },
  }),
  villagerName: new TextStyle({
    fontSize: 10,
    fill: 0xffffff,
    fontFamily: 'monospace',
    dropShadow: { color: 0x000000, distance: 1, alpha: 0.75 },
  }),
  villagerNameBold: new TextStyle({
    fontSize: 10,
    fill: 0xffffff,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    dropShadow: { color: 0x000000, distance: 1, alpha: 0.75 },
  }),
  villagerAction: new TextStyle({
    fontSize: 9,
    fill: 0xdadada,
    fontFamily: 'monospace',
  }),
  bubbleText: new TextStyle({
    fontSize: 8,
    fill: 0x1a1a2e,
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    wordWrap: true,
    wordWrapWidth: 130,
    lineHeight: 14,
    letterSpacing: -0.5,
  }),
  sleepText: new TextStyle({
    fontSize: 14,
    fill: 0xf8f8f0,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    dropShadow: { color: 0x222034, distance: 1, alpha: 0.8 },
  }),
};

interface BuildingVisual {
  roof: Container;
  label: Text;
  occlusionMask: Graphics;
  hasTexture: boolean;
}

interface VillagerVisual {
  root: Container;
  selection: Graphics;
  shadow: Sprite;
  sprite: Sprite;
  body: Graphics;
  directionMarker: Graphics;
  nameLabel: Text;
  actionLabel: Text;
  sleepLabel: Text;
}

let shadowTexture: Texture | null = null;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function shadeColor(color: number, factor: number): number {
  const r = clamp(Math.round(((color >> 16) & 0xff) * factor), 0, 255);
  const g = clamp(Math.round(((color >> 8) & 0xff) * factor), 0, 255);
  const b = clamp(Math.round((color & 0xff) * factor), 0, 255);
  return (r << 16) | (g << 8) | b;
}

function createShadowTexture(): Texture {
  if (shadowTexture) return shadowTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 48;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    shadowTexture = Texture.WHITE;
    return shadowTexture;
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(48, 24, 28, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  shadowTexture = Texture.from(canvas);
  return shadowTexture;
}

function beginPolygon(graphics: Graphics, points: Array<[number, number]>) {
  graphics.moveTo(points[0]![0], points[0]![1]);
  for (let index = 1; index < points.length; index++) {
    graphics.lineTo(points[index]![0], points[index]![1]);
  }
  graphics.closePath();
}

function drawPolygon(
  graphics: Graphics,
  points: Array<[number, number]>,
  fillColor: number,
  fillAlpha = 1,
  strokeColor?: number,
  strokeAlpha = 1,
  strokeWidth = 1,
) {
  beginPolygon(graphics, points);
  graphics.fill({ color: fillColor, alpha: fillAlpha });
  if (strokeColor !== undefined) {
    beginPolygon(graphics, points);
    graphics.stroke({ color: strokeColor, alpha: strokeAlpha, width: strokeWidth });
  }
}

function getTileDiamondPoints(centerX: number, centerY: number): Array<[number, number]> {
  return [
    [centerX, centerY - ISO.tileHeight / 2],
    [centerX + ISO.tileWidth / 2, centerY],
    [centerX, centerY + ISO.tileHeight / 2],
    [centerX - ISO.tileWidth / 2, centerY],
  ];
}

function getMapCenter(app: Application): { x: number; y: number } {
  return {
    x: app.screen.width / 2 - (MAP_BOUNDS.minX + MAP_BOUNDS.maxX) / 2,
    y: app.screen.height / 2 - (MAP_BOUNDS.minY + MAP_BOUNDS.maxY) / 2 - ISO.tileHeight * 1.5,
  };
}

function syncCameraStore(world: Container) {
  useUIStore.getState().setCamera(world.x, world.y);
  useUIStore.getState().setZoom(world.scale.x);
}

function clampWorldPosition(world: Container, app: Application) {
  const paddingX = ISO.tileWidth * 1.5;
  const paddingY = ISO.tileHeight * 2.5;
  const scaledWidth = MAP_BOUNDS.width * world.scale.x;
  const scaledHeight = MAP_BOUNDS.height * world.scale.y;

  if (scaledWidth + paddingX * 2 <= app.screen.width) {
    world.x = app.screen.width / 2 - ((MAP_BOUNDS.minX + MAP_BOUNDS.maxX) / 2) * world.scale.x;
  } else {
    const minX = app.screen.width - paddingX - MAP_BOUNDS.maxX * world.scale.x;
    const maxX = paddingX - MAP_BOUNDS.minX * world.scale.x;
    world.x = clamp(world.x, minX, maxX);
  }

  if (scaledHeight + paddingY * 2 <= app.screen.height) {
    world.y = app.screen.height / 2 - ((MAP_BOUNDS.minY + MAP_BOUNDS.maxY) / 2) * world.scale.y;
  } else {
    const minY = app.screen.height - paddingY - MAP_BOUNDS.maxY * world.scale.y;
    const maxY = paddingY - MAP_BOUNDS.minY * world.scale.y;
    world.y = clamp(world.y, minY, maxY);
  }
}

function zoomWorldAtScreenPoint(
  world: Container,
  app: Application,
  pointerX: number,
  pointerY: number,
  newScale: number,
  centerOnPoint = false,
) {
  const localX = (pointerX - world.x) / world.scale.x;
  const localY = (pointerY - world.y) / world.scale.y;

  world.scale.set(newScale, newScale);

  if (centerOnPoint) {
    world.x = app.screen.width / 2 - localX * newScale;
    world.y = app.screen.height / 2 - localY * newScale;
  } else {
    world.x = pointerX - localX * newScale;
    world.y = pointerY - localY * newScale;
  }

  clampWorldPosition(world, app);
  syncCameraStore(world);
}

function drawTerrain(container: Container, assets: IsometricAssetBundle) {
  for (let y = 0; y < MAP_DATA.height; y++) {
    for (let x = 0; x < MAP_DATA.width; x++) {
      const terrain = MAP_DATA.terrainGrid[y]?.[x] ?? 'grass';
      const center = getFootprintCenter(x, y, ISO);
      const texture = assets.terrain[terrain];

      if (texture) {
        const sprite = new Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.x = center.x;
        sprite.y = center.y;
        sprite.width = ISO.tileWidth;
        sprite.height = ISO.tileHeight;
        container.addChild(sprite);
        continue;
      }

      const tile = new Graphics();
      const points = getTileDiamondPoints(center.x, center.y);
      const fill = TERRAIN_COLORS[terrain] ?? TERRAIN_COLORS.grass;
      drawPolygon(tile, points, fill, 1, shadeColor(fill, 0.65), 0.8, 1);

      if (terrain === 'water') {
        tile.moveTo(center.x - ISO.tileWidth * 0.18, center.y - 2);
        tile.lineTo(center.x + ISO.tileWidth * 0.12, center.y - ISO.tileHeight * 0.16);
        tile.stroke({ color: 0xd6f4ff, alpha: 0.4, width: 1 });
      }

      if (terrain === 'bridge') {
        for (let step = -1; step <= 1; step++) {
          const offset = step * 8;
          tile.moveTo(center.x - ISO.tileWidth * 0.18, center.y + offset * 0.1);
          tile.lineTo(center.x + ISO.tileWidth * 0.18, center.y + offset * 0.1);
        }
        tile.stroke({ color: 0x5e4126, alpha: 0.6, width: 1 });
      }

      container.addChild(tile);
    }
  }
}

function getDecorationAnchor(decoration: MapDecoration) {
  return gridToScreen(decoration.x + decoration.w / 2, decoration.y + decoration.h, ISO);
}

function drawDecorationFallback(graphics: Graphics, decoration: MapDecoration) {
  const tint = decoration.render.tint ?? 0xffffff;

  switch (decoration.sprite) {
    case 'oak_tree':
    case 'pine_tree':
    case 'cherry_tree':
      graphics.roundRect(-4, -24, 8, 18, 2).fill({ color: 0x6a4a2f });
      graphics.ellipse(0, -32, 16, 14).fill({ color: tint });
      graphics.ellipse(0, -42, 12, 10).fill({ color: shadeColor(tint, 1.08) });
      break;
    case 'bush':
      graphics.ellipse(0, -8, 12, 8).fill({ color: tint });
      break;
    case 'flowers':
      graphics.circle(-6, -7, 3).fill({ color: tint });
      graphics.circle(0, -10, 3).fill({ color: 0xf8f8f0 });
      graphics.circle(6, -7, 3).fill({ color: tint });
      break;
    case 'small_rocks':
      graphics.circle(-5, -4, 4).fill({ color: tint });
      graphics.circle(2, -6, 5).fill({ color: shadeColor(tint, 1.1) });
      graphics.circle(8, -3, 3).fill({ color: tint });
      break;
    case 'bench':
      graphics.moveTo(-12, -7);
      graphics.lineTo(0, -13);
      graphics.lineTo(12, -7);
      graphics.lineTo(0, -1);
      graphics.closePath();
      graphics.fill({ color: tint });
      graphics.rect(-10, -1, 3, 9).fill({ color: shadeColor(tint, 0.7) });
      graphics.rect(7, -1, 3, 9).fill({ color: shadeColor(tint, 0.7) });
      break;
    case 'reeds':
      for (let offset = -4; offset <= 4; offset += 4) {
        graphics.moveTo(offset, 0);
        graphics.lineTo(offset - 2, -10);
      }
      graphics.stroke({ color: tint, width: 2, alpha: 0.9 });
      break;
    default:
      graphics.circle(0, -6, 6).fill({ color: tint });
      break;
  }
}

function addDecorations(container: Container, assets: IsometricAssetBundle) {
  for (const decoration of MAP_DATA.decorations) {
    const anchor = getDecorationAnchor(decoration);
    const node = new Container();
    node.x = anchor.x;
    node.y = anchor.y;
    node.zIndex = getDepthSortKey(
      decoration.x + decoration.w / 2,
      decoration.y + decoration.h,
      decoration.render.elevation ?? 0,
      decoration.render.sortOffset ?? 0,
    );

    const texture = assets.decorations[decoration.id];
    if (texture) {
      const sprite = new Sprite(texture);
      sprite.anchor.set(decoration.render.anchor.x, decoration.render.anchor.y);
      sprite.width = ISO.tileWidth * Math.max(1, decoration.w);
      sprite.height = ISO.tileHeight * (Math.max(1, decoration.h) + 1.5);
      node.addChild(sprite);
    } else {
      const graphics = new Graphics();
      drawDecorationFallback(graphics, decoration);
      node.addChild(graphics);
    }

    container.addChild(node);
  }
}

function getBuildingFootprint(building: MapBuilding): Array<[number, number]> {
  return [
    [gridToScreen(building.x, building.y, ISO).x, gridToScreen(building.x, building.y, ISO).y],
    [gridToScreen(building.x + building.w, building.y, ISO).x, gridToScreen(building.x + building.w, building.y, ISO).y],
    [gridToScreen(building.x + building.w, building.y + building.h, ISO).x, gridToScreen(building.x + building.w, building.y + building.h, ISO).y],
    [gridToScreen(building.x, building.y + building.h, ISO).x, gridToScreen(building.x, building.y + building.h, ISO).y],
  ];
}

function drawBuildingFallback(base: Graphics, roof: Graphics, building: MapBuilding) {
  const footprint = getBuildingFootprint(building);
  const heightPx = (building.render.elevation ?? building.h) * ISO.elevationStep + ISO.tileHeight * 0.9;
  const top = footprint.map(([x, y]) => [x, y - heightPx] as [number, number]);
  const tint = building.render.tint ?? building.color;

  base.clear();
  roof.clear();

  const westFace: Array<[number, number]> = [top[3]!, top[2]!, footprint[2]!, footprint[3]!];
  const eastFace: Array<[number, number]> = [top[1]!, top[2]!, footprint[2]!, footprint[1]!];

  drawPolygon(base, westFace, shadeColor(tint, 0.78), 1, shadeColor(tint, 0.45), 0.85, 1);
  drawPolygon(base, eastFace, shadeColor(tint, 0.62), 1, shadeColor(tint, 0.42), 0.85, 1);
  drawPolygon(roof, top, shadeColor(tint, 1.06), 1, shadeColor(tint, 0.52), 0.9, 1);
}

function addBuildings(
  container: Container,
  overlayContainer: Container,
  assets: IsometricAssetBundle,
): Map<string, BuildingVisual> {
  const visuals = new Map<string, BuildingVisual>();

  for (const building of MAP_DATA.buildings) {
    const depth = getDepthSortKey(
      building.x + building.w / 2,
      building.y + building.h,
      building.render.elevation ?? 0,
      building.render.sortOffset ?? 0,
    );

    const base = new Container();
    base.zIndex = depth;
    const baseGraphics = new Graphics();
    base.addChild(baseGraphics);

    const roof = new Container();
    roof.zIndex = depth + 150;
    const roofGraphics = new Graphics();
    roof.addChild(roofGraphics);
    const occlusionMask = new Graphics();
    roof.addChild(occlusionMask);

    const texture = assets.buildings[building.id];
    if (texture) {
      const sprite = new Sprite(texture);
      const anchor = gridToScreen(building.x + building.w / 2, building.y + building.h, ISO);
      sprite.anchor.set(building.render.anchor.x, building.render.anchor.y);
      sprite.x = anchor.x;
      sprite.y = anchor.y;
      sprite.width = ISO.tileWidth * (building.w + building.h * 0.5);
      sprite.height = ISO.tileHeight * ((building.render.elevation ?? building.h) + building.h + 2);
      roof.addChild(sprite);
    } else {
      drawBuildingFallback(baseGraphics, roofGraphics, building);
    }

    container.addChild(base);
    container.addChild(roof);

    const labelAnchor = gridToScreen(
      building.x + building.w / 2,
      building.y + building.h / 2,
      ISO,
      building.render.elevation ?? 0,
    );
    const label = new Text({ text: building.label, style: cachedStyles.buildingLabel });
    label.anchor.set(0.5, 1);
    label.x = labelAnchor.x;
    label.y = labelAnchor.y - ISO.tileHeight * 0.7;
    label.zIndex = depth + 160;
    overlayContainer.addChild(label);

    visuals.set(building.id, { roof, label, occlusionMask, hasTexture: !!texture });
  }

  return visuals;
}

function createVillagerVisual(sceneContainer: Container, overlayContainer: Container): VillagerVisual {
  const root = new Container();
  const selection = new Graphics();
  const shadow = new Sprite(createShadowTexture());
  shadow.anchor.set(0.5);
  shadow.width = ISO.tileWidth * 0.58;
  shadow.height = ISO.tileHeight * 0.55;

  const sprite = new Sprite();
  sprite.anchor.set(0.5, 1);

  const body = new Graphics();
  const directionMarker = new Graphics();

  root.addChild(selection);
  root.addChild(shadow);
  root.addChild(sprite);
  root.addChild(body);
  root.addChild(directionMarker);

  const nameLabel = new Text({ text: '', style: cachedStyles.villagerName });
  nameLabel.anchor.set(0.5, 1);
  const actionLabel = new Text({ text: '', style: cachedStyles.villagerAction });
  actionLabel.anchor.set(0.5, 0);
  const sleepLabel = new Text({ text: 'Zz', style: cachedStyles.sleepText });
  sleepLabel.anchor.set(0.5, 1);
  sleepLabel.visible = false;

  sceneContainer.addChild(root);
  overlayContainer.addChild(nameLabel);
  overlayContainer.addChild(actionLabel);
  overlayContainer.addChild(sleepLabel);

  return {
    root,
    selection,
    shadow,
    sprite,
    body,
    directionMarker,
    nameLabel,
    actionLabel,
    sleepLabel,
  };
}

function getVillagerTexture(
  assets: IsometricAssetBundle,
  villagerId: string,
  direction: Direction,
  isMoving: boolean,
  now: number,
): Texture | null {
  const villagerAssets: VillagerTextureSet | undefined = assets.villagers[villagerId];
  if (!villagerAssets) return null;

  if (isMoving) {
    const walkFrames = villagerAssets.walk[direction];
    if (walkFrames && walkFrames.length > 0) {
      const frameIndex = Math.floor(now / WALK_FRAME_DURATION_MS) % walkFrames.length;
      return walkFrames[frameIndex] ?? null;
    }
  }

  return villagerAssets.idle[direction] ?? null;
}

function createVillagerBody(
  pool: VillagerVisual,
  villager: Villager,
  isSelected: boolean,
  texture: Texture | null,
) {
  pool.selection.clear();
  pool.body.clear();
  pool.directionMarker.clear();

  if (isSelected) {
    const selectionYOffset = -ISO.tileHeight * 0.32;
    const ringPoints: Array<[number, number]> = [
      [0, selectionYOffset - ISO.tileHeight * 0.15],
      [ISO.tileWidth * 0.26, selectionYOffset],
      [0, selectionYOffset + ISO.tileHeight * 0.15],
      [-ISO.tileWidth * 0.26, selectionYOffset],
    ];
    drawPolygon(pool.selection, ringPoints, 0xffffff, 0.18, 0xffffff, 0.55, 1);
  }

  if (texture) {
    pool.sprite.texture = texture;
    pool.sprite.visible = true;
    pool.sprite.width = ISO.tileWidth * 0.9;
    pool.sprite.height = ISO.tileHeight * 2.6;
    pool.body.visible = false;
  } else {
    pool.sprite.visible = false;
    pool.body.visible = true;

    const color = VILLAGER_COLORS[villager.profile.id] ?? 0xffffff;
    pool.body.roundRect(-9, -32, 18, 20, 6).fill({ color });
    pool.body.roundRect(-7, -16, 14, 16, 5).fill({ color: shadeColor(color, 0.9) });
    pool.body.circle(0, -40, 9).fill({ color: shadeColor(color, 1.1) });
    pool.body.stroke({ color: 0x1a1a1a, alpha: 0.9, width: 1 });

    const rotation = DIRECTION_ROTATIONS[villager.state.facing] ?? DIRECTION_ROTATIONS.south;
    const markerPoints: Array<[number, number]> = [
      [0, -22],
      [6, -12],
      [-6, -12],
    ];
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const rotated = markerPoints.map(([x, y]) => [
      x * cos - y * sin,
      x * sin + y * cos,
    ] as [number, number]);
    drawPolygon(pool.directionMarker, rotated, 0xffffff, 0.55);
  }
}

function drawSpeechBubble(container: Container, villager: Villager, text: string, alpha: number) {
  const foot = getFootprintCenter(villager.state.x, villager.state.y, ISO);
  const textObj = new Text({ text, style: cachedStyles.bubbleText });
  textObj.anchor.set(0.5, 1);

  const padX = 8;
  const padY = 6;
  const border = 2;
  const bubbleWidth = textObj.width + padX * 2;
  const bubbleHeight = textObj.height + padY * 2;
  const bubbleX = foot.x - bubbleWidth / 2;
  const bubbleY = foot.y - ISO.tileHeight * 2.7 - bubbleHeight;

  const bg = new Graphics();
  bg.alpha = alpha;
  bg.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 4).fill({ color: 0xf8f8f0 });
  bg.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 4).stroke({ color: 0x222034, width: border, alpha: 1 });

  const pointerBaseY = bubbleY + bubbleHeight;
  bg.moveTo(foot.x - 8, pointerBaseY);
  bg.lineTo(foot.x + 8, pointerBaseY);
  bg.lineTo(foot.x, pointerBaseY + 12);
  bg.closePath();
  bg.fill({ color: 0xf8f8f0 });
  bg.moveTo(foot.x - 8, pointerBaseY);
  bg.lineTo(foot.x + 8, pointerBaseY);
  bg.lineTo(foot.x, pointerBaseY + 12);
  bg.closePath();
  bg.stroke({ color: 0x222034, width: border, alpha: 1 });

  container.addChild(bg);
  textObj.x = foot.x;
  textObj.y = bubbleY + bubbleHeight - padY;
  textObj.alpha = alpha;
  container.addChild(textObj);
}

function updateLighting(overlay: Graphics, hour: number) {
  overlay.clear();

  let color = 0x000000;
  let alpha = 0;
  if (hour >= 5 && hour < 7) {
    color = 0xffcc88;
    alpha = 0.15;
  } else if (hour >= 16 && hour < 19) {
    color = 0xff8a55;
    alpha = ((hour - 16) / 3) * 0.22;
  } else if (hour >= 19 && hour < 21) {
    color = 0x332255;
    alpha = 0.2 + ((hour - 19) / 2) * 0.22;
  } else if (hour >= 21 || hour < 5) {
    color = 0x18203f;
    alpha = 0.42;
  }

  if (alpha <= 0) return;

  const corners: Array<[number, number]> = [
    [gridToScreen(0, 0, ISO).x, gridToScreen(0, 0, ISO).y],
    [gridToScreen(MAP_DATA.width, 0, ISO).x, gridToScreen(MAP_DATA.width, 0, ISO).y],
    [gridToScreen(MAP_DATA.width, MAP_DATA.height, ISO).x, gridToScreen(MAP_DATA.width, MAP_DATA.height, ISO).y],
    [gridToScreen(0, MAP_DATA.height, ISO).x, gridToScreen(0, MAP_DATA.height, ISO).y],
  ];

  drawPolygon(overlay, corners, color, alpha);
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const worldContainerRef = useRef<Container | null>(null);
  const assetsRef = useRef<IsometricAssetBundle | null>(null);
  const [ready, setReady] = useState(false);

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new Application();
    let destroyed = false;

    (async () => {
      await app.init({
        background: 0x192028,
        resizeTo: canvasRef.current!,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (destroyed || !canvasRef.current) {
        app.destroy();
        return;
      }

      canvasRef.current.appendChild(app.canvas as HTMLCanvasElement);
      appRef.current = app;

      const worldContainer = new Container();
      app.stage.addChild(worldContainer);
      worldContainer.sortableChildren = true;
      worldContainerRef.current = worldContainer;

      const assets = await loadIsometricAssets(VILLAGER_IDS, MAP_DATA.buildings, MAP_DATA.decorations);
      assetsRef.current = assets;

      const { cameraX, cameraY, zoom } = useUIStore.getState();
      const centered = getMapCenter(app);
      worldContainer.scale.set(zoom, zoom);
      worldContainer.x = cameraX === 0 && cameraY === 0 ? centered.x : cameraX;
      worldContainer.y = cameraX === 0 && cameraY === 0 ? centered.y : cameraY;
      clampWorldPosition(worldContainer, app);
      syncCameraStore(worldContainer);

      initializeGame();
      setReady(true);
    })();

    return () => {
      destroyed = true;
      appRef.current?.destroy(true);
      appRef.current = null;
      worldContainerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !appRef.current || !worldContainerRef.current || !assetsRef.current) return;

    const app = appRef.current;
    const world = worldContainerRef.current;
    const assets = assetsRef.current;

    const terrainContainer = new Container();
    const sceneContainer = new Container();
    sceneContainer.sortableChildren = true;
    const overlayContainer = new Container();
    overlayContainer.sortableChildren = true;
    const bubblesContainer = new Container();
    const lightingOverlay = new Graphics();

    world.addChild(terrainContainer);
    world.addChild(sceneContainer);
    world.addChild(overlayContainer);
    world.addChild(bubblesContainer);
    world.addChild(lightingOverlay);

    drawTerrain(terrainContainer, assets);
    addDecorations(sceneContainer, assets);
    const buildingVisuals = addBuildings(sceneContainer, overlayContainer, assets);

    const villagerPool = new Map<string, VillagerVisual>();
    let lastLightingHour = -1;

    const ticker = () => {
      const { villagers, speechBubbles, world: worldState } = useGameStore.getState();
      const { selectedVillagerId } = useUIStore.getState();
      const now = Date.now();

      for (const building of MAP_DATA.buildings) {
        const insideVillagers = villagers.filter(
          (villager) =>
            villager.state.x >= building.x &&
            villager.state.x < building.x + building.w &&
            villager.state.y >= building.y &&
            villager.state.y < building.y + building.h,
        );
        const occupied = insideVillagers.length > 0;

        const visual = buildingVisuals.get(building.id);
        if (!visual) continue;

        visual.occlusionMask.clear();
        if (visual.hasTexture && occupied && building.render.roofFadeWhenOccupied) {
          for (const villager of insideVillagers) {
            const foot = getFootprintCenter(villager.state.x, villager.state.y, ISO);
            visual.occlusionMask.ellipse(
              foot.x,
              foot.y - ISO.tileHeight * 0.95,
              ISO.tileWidth * 0.32,
              ISO.tileHeight * 0.95,
            ).fill({ color: 0xffffff, alpha: 1 });
          }
          visual.roof.setMask({ mask: visual.occlusionMask, inverse: true });
          visual.roof.alpha = 1;
        } else {
          visual.roof.mask = null;
          visual.roof.alpha = 1;
        }

        visual.label.alpha = occupied ? 0.5 : 1;
      }

      if (worldState.time.hour !== lastLightingHour) {
        updateLighting(lightingOverlay, worldState.time.hour);
        lastLightingHour = worldState.time.hour;
      }

      for (const villager of villagers) {
        let pool = villagerPool.get(villager.profile.id);
        if (!pool) {
          pool = createVillagerVisual(sceneContainer, overlayContainer);
          villagerPool.set(villager.profile.id, pool);
        }

        const foot = getFootprintCenter(villager.state.x, villager.state.y, ISO);
        const selected = villager.profile.id === selectedVillagerId;
        const texture = getVillagerTexture(
          assets,
          villager.profile.id,
          villager.state.facing,
          villager.state.isMoving,
          now,
        );

        pool.root.x = foot.x;
        pool.root.y = foot.y;
        pool.root.zIndex = getDepthSortKey(villager.state.x, villager.state.y, 0, 260);
        pool.shadow.x = 0;
        pool.shadow.y = -ISO.tileHeight * 0.7;
        pool.shadow.alpha = villager.state.currentAction?.type === 'sleeping' ? 0.12 : 0.22;

        createVillagerBody(pool, villager, selected, texture);

        pool.nameLabel.text = villager.profile.name;
        pool.nameLabel.style = selected ? cachedStyles.villagerNameBold : cachedStyles.villagerName;
        pool.nameLabel.x = foot.x;
        pool.nameLabel.y = foot.y - ISO.tileHeight * 1.9;
        pool.nameLabel.zIndex = pool.root.zIndex + 2;

        if (selected && villager.state.currentAction) {
          pool.actionLabel.text = ACTION_LABELS[villager.state.currentAction.type] ?? '';
          pool.actionLabel.visible = true;
          pool.actionLabel.x = foot.x;
          pool.actionLabel.y = foot.y + ISO.tileHeight * 0.2;
          pool.actionLabel.zIndex = pool.root.zIndex + 3;
        } else {
          pool.actionLabel.visible = false;
        }

        if (villager.state.currentAction?.type === 'sleeping') {
          pool.sleepLabel.visible = true;
          pool.sleepLabel.x = foot.x + 14;
          pool.sleepLabel.y = foot.y - ISO.tileHeight * 2.8 + Math.sin(now / 300 + foot.x * 0.02) * 4;
          pool.sleepLabel.alpha = 0.7 + 0.25 * Math.sin(now / 400 + foot.y * 0.02);
          pool.sleepLabel.zIndex = pool.root.zIndex + 4;
        } else {
          pool.sleepLabel.visible = false;
        }
      }

      destroyChildren(bubblesContainer);
      for (const bubble of speechBubbles) {
        if (now >= bubble.expiresAt || now < bubble.createdAt) continue;
        const villager = villagers.find((entry) => entry.profile.id === bubble.villagerId);
        if (!villager) continue;

        const age = now - bubble.createdAt;
        const lifetime = bubble.expiresAt - bubble.createdAt;
        const fadeStart = lifetime * 0.72;
        const alpha = age > fadeStart ? 1 - (age - fadeStart) / Math.max(1, lifetime - fadeStart) : 1;
        drawSpeechBubble(bubblesContainer, villager, bubble.text, alpha);
      }
    };

    app.ticker.add(ticker);
    return () => {
      app.ticker.remove(ticker);
      destroyChildren(world);
      villagerPool.clear();
    };
  }, [ready]);

  useEffect(() => {
    const element = canvasRef.current;
    const app = appRef.current;
    const world = worldContainerRef.current;
    if (!ready || !element || !app || !world) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      const scaleDelta = event.deltaY > 0 ? 0.92 : 1.08;
      const newScale = clamp(world.scale.x * scaleDelta, 0.55, 2.25);
      zoomWorldAtScreenPoint(world, app, pointerX, pointerY, newScale);
    };

    const onPointerDown = (event: PointerEvent) => {
      isDragging.current = true;
      dragStart.current = { x: event.clientX, y: event.clientY };
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!isDragging.current) return;
      world.x += event.clientX - dragStart.current.x;
      world.y += event.clientY - dragStart.current.y;
      dragStart.current = { x: event.clientX, y: event.clientY };
      clampWorldPosition(world, app);
      syncCameraStore(world);
    };

    const onPointerUp = () => {
      isDragging.current = false;
    };

    const onClick = (event: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const localX = (event.clientX - rect.left - world.x) / world.scale.x;
      const localY = (event.clientY - rect.top - world.y) / world.scale.y;
      const clicked = pickVillagerAtScreenPoint(useGameStore.getState().villagers, localX, localY, ISO);

      if (clicked) {
        useUIStore.getState().selectVillager(clicked.profile.id);
        return;
      }

      const projectedTile = screenToGrid(localX, localY, ISO);
      if (
        projectedTile.x >= 0 &&
        projectedTile.y >= 0 &&
        projectedTile.x < MAP_DATA.width &&
        projectedTile.y < MAP_DATA.height
      ) {
        useUIStore.getState().selectVillager(null);
      }
    };

    const onDoubleClick = (event: MouseEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      const newScale = clamp(world.scale.x * 1.45, 0.55, 2.25);
      zoomWorldAtScreenPoint(world, app, pointerX, pointerY, newScale, true);
    };

    const onResize = () => {
      clampWorldPosition(world, app);
      syncCameraStore(world);
    };

    element.addEventListener('wheel', onWheel, { passive: false });
    element.addEventListener('pointerdown', onPointerDown);
    element.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    element.addEventListener('click', onClick);
    element.addEventListener('dblclick', onDoubleClick);
    window.addEventListener('resize', onResize);

    return () => {
      element.removeEventListener('wheel', onWheel);
      element.removeEventListener('pointerdown', onPointerDown);
      element.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      element.removeEventListener('click', onClick);
      element.removeEventListener('dblclick', onDoubleClick);
      window.removeEventListener('resize', onResize);
    };
  }, [ready]);

  return <div ref={canvasRef} className="h-full w-full" />;
}

function destroyChildren(container: Container) {
  while (container.children.length > 0) {
    const child = container.children[0]!;
    container.removeChild(child);
    child.destroy({ children: true });
  }
}
