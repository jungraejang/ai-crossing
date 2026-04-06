'use client';

import { useEffect, useRef, useState } from 'react';
import { Application, Container, Graphics, Text, TextStyle, Sprite, Assets, Texture, Rectangle } from 'pixi.js';
import { useGameStore } from '@/stores/gameStore';
import type { SpeechBubble } from '@/stores/gameStore';
import { useUIStore } from '@/stores/uiStore';
import { initializeGame } from '@/lib/initGame';
import { MAP_DATA } from '@/lib/mapData';
import type { TerrainType, MapDecoration } from '@/lib/mapData';
import { ACTION_LABELS } from '@ai-crossing/shared';
import type { Villager, Direction } from '@ai-crossing/shared';

const TILE = MAP_DATA.tileSize;

function destroyContainerChildren(container: Container) {
  while (container.children.length > 0) {
    const child = container.children[0]!;
    container.removeChild(child);
    child.destroy({ children: true });
  }
}
const WALK_FRAME_COUNT = 4;
const WALK_ANIM_SPEED = 150;

const VILLAGER_IDS = [
  'maple', 'jasper', 'luna', 'rowan', 'sage', 'felix',
  'coral', 'finn', 'ivy', 'milo', 'pearl', 'otto',
  'hazel', 'cliff', 'wren', 'birch', 'ember', 'fern',
  'slate', 'poppy', 'reed', 'dusk', 'cinder', 'flint',
];

const DIRECTION_MAP: Record<Direction, string> = {
  down: 'south',
  up: 'north',
  left: 'west',
  right: 'east',
};

const VILLAGER_COLORS: Record<string, number> = {
  maple: 0xff6b6b, jasper: 0x51cf66, luna: 0x845ef7, rowan: 0xff922b,
  sage: 0x20c997, felix: 0xfcc419, coral: 0xf06595, finn: 0x339af0,
  ivy: 0x2b8a3e, milo: 0xe67700, pearl: 0xda77f2, otto: 0x868e96,
  hazel: 0xc2185b, cliff: 0x795548, wren: 0x4fc3f7, birch: 0xaed581,
  ember: 0xff7043, fern: 0x66bb6a, slate: 0x78909c, poppy: 0xef5350,
  reed: 0x558b2f, dusk: 0x5c6bc0, cinder: 0xd4a373, flint: 0x6d4c41,
};

const GROUND_COLORS: Record<number, number> = {
  1: 0x4a7c59, 2: 0x3d6b4e, 3: 0x2980b9, 4: 0x8b6914,
};

let sleepTexture: Texture | null = null;
let shadowTexture: Texture | null = null;

function createSleepTexture(): Texture {
  if (sleepTexture) return sleepTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 48;
  canvas.height = 24;
  const ctx = canvas.getContext('2d')!;

  const outline = '#222034';
  const fill = '#f8f8f0';

  const drawPixelZ = (x: number, y: number, s: number) => {
    ctx.fillStyle = outline;
    ctx.fillRect(x, y, s * 4, s);
    ctx.fillRect(x + s * 3, y + s, s, s);
    ctx.fillRect(x + s * 2, y + s * 2, s, s);
    ctx.fillRect(x + s, y + s * 3, s, s);
    ctx.fillRect(x, y + s * 4, s * 4, s);

    ctx.fillStyle = fill;
    ctx.fillRect(x + s, y + 1, s * 2, s - 2);
    ctx.fillRect(x + s * 3, y + s + 1, s - 1, s - 2);
    ctx.fillRect(x + s * 2, y + s * 2 + 1, s - 1, s - 2);
    ctx.fillRect(x + s, y + s * 3 + 1, s - 1, s - 2);
    ctx.fillRect(x + s, y + s * 4 + 1, s * 2, s - 2);
  };

  drawPixelZ(2, 10, 2);
  drawPixelZ(16, 5, 2);
  drawPixelZ(30, 1, 2);

  sleepTexture = Texture.from(canvas);
  return sleepTexture;
}

function createShadowTexture(): Texture {
  if (shadowTexture) return shadowTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 48;
  canvas.height = 20;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(24, 10, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  shadowTexture = Texture.from(canvas);
  return shadowTexture;
}

const spriteTextures: Record<string, Texture> = {};
const walkTextures: Record<string, Texture[]> = {};
const tilesetTextures: Record<string, Texture> = {};
const tilesetMeta: Record<string, { tiles: Array<{ corners: Record<string, string>; bounding_box: { x: number; y: number; width: number; height: number } }> }> = {};
const buildingTextures: Record<string, Texture> = {};
const decorationTextures: Record<string, Texture> = {};
let bridgeTexture: Texture | null = null;
let spritesLoaded = false;

async function loadAllSprites() {
  if (spritesLoaded) return;

  const promises: Promise<void>[] = [];

  for (const id of VILLAGER_IDS) {
    for (const dir of ['south', 'north', 'east', 'west']) {
      const key = `${id}_${dir}`;
      promises.push(
        Assets.load(`/sprites/${key}.png`).then((tex: Texture) => {
          spriteTextures[key] = tex;
        }).catch(() => {})
      );

      const walkKey = `${id}_walk_${dir}`;
      walkTextures[walkKey] = [];
      for (let f = 0; f < WALK_FRAME_COUNT; f++) {
        promises.push(
          Assets.load(`/sprites/${walkKey}_${f}.png`).then((tex: Texture) => {
            if (!walkTextures[walkKey]) walkTextures[walkKey] = [];
            walkTextures[walkKey]![f] = tex;
          }).catch(() => {})
        );
      }
    }
  }

  for (const name of ['water_grass', 'grass_dirt', 'grass_cobble']) {
    promises.push(
      Assets.load(`/tilesets/${name}.png`).then((tex: Texture) => {
        tilesetTextures[name] = tex;
      }).catch(() => {})
    );
    promises.push(
      fetch(`/tilesets/${name}_meta.json`).then((r) => r.json()).then((meta) => {
        tilesetMeta[name] = meta.tileset_data ?? meta;
      }).catch(() => {})
    );
  }

  promises.push(
    Assets.load('/tilesets/bridge.png').then((tex: Texture) => {
      bridgeTexture = tex;
    }).catch(() => {})
  );

  const buildingFiles: Record<string, string> = {
    home_1: 'home_1', home_2: 'home_2', home_3: 'home_3',
    home_4: 'home_4', home_5: 'home_5', home_6: 'home_6',
    home_7: 'home_7', home_8: 'home_8', home_9: 'home_9',
    home_10: 'home_10', home_11: 'home_11', home_12: 'home_12',
    cafe: 'cafe', store: 'store', workshop: 'workshop',
    garden: 'garden', town_square: 'fountain',
  };

  const decorationSpriteNames = [...new Set(MAP_DATA.decorations.map((d) => d.sprite))];
  for (const name of decorationSpriteNames) {
    promises.push(
      Assets.load(`/decorations/${name}.png`).then((tex: Texture) => {
        decorationTextures[name] = tex;
      }).catch(() => {})
    );
  }

  for (const [buildingId, fileName] of Object.entries(buildingFiles)) {
    promises.push(
      Assets.load(`/buildings/${fileName}.png`).then((tex: Texture) => {
        buildingTextures[buildingId] = tex;
      }).catch(() => {})
    );
  }

  await Promise.all(promises);
  spritesLoaded = true;
}

const walkFrameCache: Map<string, Texture[]> = new Map();

function getWalkFrame(villagerId: string, direction: string, timestamp: number): Texture | null {
  const key = `${villagerId}_walk_${direction}`;
  let validFrames = walkFrameCache.get(key);
  if (!validFrames) {
    const frames = walkTextures[key];
    if (!frames || frames.length === 0) return null;
    validFrames = frames.filter(Boolean);
    if (validFrames.length === 0) return null;
    walkFrameCache.set(key, validFrames);
  }

  const frameIndex = Math.floor(timestamp / WALK_ANIM_SPEED) % validFrames.length;
  return validFrames[frameIndex] ?? null;
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const worldContainerRef = useRef<Container | null>(null);
  const [ready, setReady] = useState(false);

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new Application();
    let destroyed = false;

    (async () => {
      await app.init({
        background: 0x1a1a2e,
        resizeTo: canvasRef.current!,
        antialias: false,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (destroyed) {
        app.destroy();
        return;
      }

      canvasRef.current!.appendChild(app.canvas as HTMLCanvasElement);
      appRef.current = app;

      const worldContainer = new Container();
      app.stage.addChild(worldContainer);
      worldContainerRef.current = worldContainer;

      worldContainer.x = app.screen.width / 2 - (MAP_DATA.width * TILE) / 2;
      worldContainer.y = app.screen.height / 2 - (MAP_DATA.height * TILE) / 2;

      await loadAllSprites();
      drawMap(worldContainer);
      drawDecorations(worldContainer);
      initializeGame();
      setReady(true);
    })();

    return () => {
      destroyed = true;
      appRef.current?.destroy(true);
      appRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !appRef.current || !worldContainerRef.current) return;

    const app = appRef.current;
    const world = worldContainerRef.current;

    const buildingsContainer = new Container();
    world.addChild(buildingsContainer);
    const villagersContainer = new Container();
    world.addChild(villagersContainer);
    const labelsContainer = new Container();
    world.addChild(labelsContainer);
    const bubblesContainer = new Container();
    world.addChild(bubblesContainer);
    const lightingOverlay = new Graphics();
    world.addChild(lightingOverlay);

    const bldgSprites: Map<string, Sprite> = new Map();
    const bldgLabels: Map<string, Text> = new Map();
    const bldgOccupiedState: Map<string, boolean> = new Map();
    for (const b of MAP_DATA.buildings) {
      const tex = buildingTextures[b.id];
      if (tex) {
        const s = new Sprite(tex);
        s.x = b.x * TILE; s.y = b.y * TILE;
        s.width = b.w * TILE; s.height = b.h * TILE;
        buildingsContainer.addChild(s);
        bldgSprites.set(b.id, s);
      }
      const lbl = new Text({ text: b.label, style: cachedStyles.buildingLabel });
      lbl.x = b.x * TILE + (b.w * TILE) / 2;
      lbl.y = b.y * TILE + 4;
      lbl.anchor.set(0.5, 0);
      buildingsContainer.addChild(lbl);
      bldgLabels.set(b.id, lbl);
      bldgOccupiedState.set(b.id, false);
    }

    const vPool: Map<
      string,
      {
        shadow: Sprite;
        sprite: Sprite;
        fallback: Graphics;
        nameLabel: Text;
        actionLabel: Text;
        selectionRing: Graphics;
        sleepSprite: Sprite;
      }
    > = new Map();
    let lastLightingHour = -1;

    const ticker = () => {
      const { villagers, speechBubbles, world: worldState } = useGameStore.getState();
      const { selectedVillagerId } = useUIStore.getState();
      const now = Date.now();

      for (const b of MAP_DATA.buildings) {
        const hasInside = villagers.some((v) => v.state.x >= b.x && v.state.x < b.x + b.w && v.state.y >= b.y && v.state.y < b.y + b.h);
        const prev = bldgOccupiedState.get(b.id);
        if (prev !== hasInside) {
          const s = bldgSprites.get(b.id);
          if (s) s.alpha = hasInside ? 0.35 : 0.9;
          const lbl = bldgLabels.get(b.id);
          if (lbl) lbl.alpha = hasInside ? 0.5 : 1;
          bldgOccupiedState.set(b.id, hasInside);
        }
      }

      if (worldState.time.hour !== lastLightingHour) {
        updateLighting(lightingOverlay, worldState.time.hour);
        lastLightingHour = worldState.time.hour;
      }

      for (const v of villagers) {
        const id = v.profile.id;
        let pool = vPool.get(id);
        if (!pool) {
          const shadow = new Sprite(createShadowTexture());
          shadow.anchor.set(0.5);
          villagersContainer.addChild(shadow);
          const selectionRing = new Graphics();
          villagersContainer.addChild(selectionRing);
          const spr = new Sprite();
          spr.anchor.set(0.5, 0.5);
          villagersContainer.addChild(spr);
          const fb = new Graphics();
          villagersContainer.addChild(fb);
          const nl = new Text({ text: v.profile.name, style: cachedStyles.villagerName });
          nl.anchor.set(0.5);
          labelsContainer.addChild(nl);
          const al = new Text({ text: '', style: cachedStyles.villagerAction });
          al.anchor.set(0.5);
          labelsContainer.addChild(al);
          const sl = new Sprite(createSleepTexture());
          sl.anchor.set(0.5);
          sl.visible = false;
          labelsContainer.addChild(sl);
          pool = { shadow, sprite: spr, fallback: fb, nameLabel: nl, actionLabel: al, selectionRing, sleepSprite: sl };
          vPool.set(id, pool);
        }

        const px = v.state.x * TILE;
        const py = v.state.y * TILE;
        const dirKey = DIRECTION_MAP[v.state.facing] ?? 'south';
        const isSel = id === selectedVillagerId;

        pool.shadow.x = px;
        pool.shadow.y = py + TILE * 0.35;
        pool.shadow.width = TILE * 0.9;
        pool.shadow.height = TILE * 0.35;

        pool.selectionRing.clear();
        if (isSel) {
          pool.selectionRing.circle(px, py, TILE * 0.6).fill({ color: 0xffffff, alpha: 0.25 });
          pool.selectionRing.circle(px, py, TILE * 0.6).stroke({ color: 0xffffff, width: 1, alpha: 0.5 });
        }

        let tex: Texture | null = null;
        if (v.state.isMoving) tex = getWalkFrame(id, dirKey, now);
        if (!tex) tex = spriteTextures[`${id}_${dirKey}`] ?? null;

        if (tex) {
          pool.sprite.texture = tex;
          pool.sprite.x = px; pool.sprite.y = py;
          pool.sprite.width = TILE * 1.4; pool.sprite.height = TILE * 1.4;
          pool.sprite.visible = true;
          pool.fallback.visible = false;
        } else {
          pool.sprite.visible = false;
          pool.fallback.clear();
          const color = VILLAGER_COLORS[id] ?? 0xffffff;
          pool.fallback.circle(px, py, TILE * 0.4).fill({ color });
          pool.fallback.circle(px, py, TILE * 0.4).stroke({ color: 0x000000, width: 1 });
          pool.fallback.visible = true;
        }

        pool.nameLabel.text = v.profile.name;
        pool.nameLabel.style = isSel ? cachedStyles.villagerNameBold : cachedStyles.villagerName;
        pool.nameLabel.x = px; pool.nameLabel.y = py - TILE * 0.85;

        if (isSel && v.state.currentAction) {
          pool.actionLabel.text = ACTION_LABELS[v.state.currentAction.type] ?? '';
          pool.actionLabel.x = px; pool.actionLabel.y = py + TILE * 0.8;
          pool.actionLabel.visible = true;
        } else {
          pool.actionLabel.visible = false;
        }

        if (v.state.currentAction?.type === 'sleeping') {
          const bob = Math.sin(now / 350 + px * 0.01) * 3;
          pool.sleepSprite.x = px + 10;
          pool.sleepSprite.y = py - TILE * 1.35 + bob;
          pool.sleepSprite.alpha = 0.7 + 0.3 * Math.sin(now / 500 + px * 0.02);
          pool.sleepSprite.visible = true;
        } else {
          pool.sleepSprite.visible = false;
        }
      }

      destroyContainerChildren(bubblesContainer);
      for (const bubble of speechBubbles) {
        if (now >= bubble.expiresAt || now < bubble.createdAt) continue;
        const villager = villagers.find((v) => v.profile.id === bubble.villagerId);
        if (!villager) continue;
        const age = now - bubble.createdAt;
        const lifetime = bubble.expiresAt - bubble.createdAt;
        const fadeStart = lifetime * 0.7;
        const alpha = age > fadeStart ? 1 - (age - fadeStart) / (lifetime - fadeStart) : 1;
        drawSpeechBubble(bubblesContainer, villager, bubble.text, alpha);
      }
    };

    app.ticker.add(ticker);
    return () => {
      app.ticker.remove(ticker);
      world.removeChild(buildingsContainer);
      world.removeChild(villagersContainer);
      world.removeChild(labelsContainer);
      world.removeChild(bubblesContainer);
      world.removeChild(lightingOverlay);
      buildingsContainer.destroy({ children: true });
      villagersContainer.destroy({ children: true });
      labelsContainer.destroy({ children: true });
      bubblesContainer.destroy({ children: true });
      lightingOverlay.destroy();
      vPool.clear();
    };
  }, [ready]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const world = worldContainerRef.current;
      if (!world) return;
      const scaleDelta = e.deltaY > 0 ? 0.95 : 1.05;
      const newScale = Math.max(0.5, Math.min(3, world.scale.x * scaleDelta));
      world.scale.set(newScale, newScale);
    };

    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const world = worldContainerRef.current;
      if (!world) return;
      world.x += e.clientX - dragStart.current.x;
      world.y += e.clientY - dragStart.current.y;
      dragStart.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDragging.current = false;
    };

    const onClick = (e: MouseEvent) => {
      const world = worldContainerRef.current;
      if (!world) return;

      const rect = el.getBoundingClientRect();
      const localX = (e.clientX - rect.left - world.x) / world.scale.x;
      const localY = (e.clientY - rect.top - world.y) / world.scale.y;
      const tileX = localX / TILE;
      const tileY = localY / TILE;

      const { villagers } = useGameStore.getState();
      const clicked = villagers.find((v) => {
        return Math.abs(v.state.x - tileX) < 0.8 && Math.abs(v.state.y - tileY) < 0.8;
      });

      useUIStore.getState().selectVillager(clicked?.profile.id ?? null);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('click', onClick);

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('click', onClick);
    };
  }, []);

  return <div ref={canvasRef} className="w-full h-full" />;
}

function getTerrain(x: number, y: number): TerrainType {
  if (y < 0 || y >= MAP_DATA.height || x < 0 || x >= MAP_DATA.width) return 'grass';
  return MAP_DATA.terrainGrid[y]?.[x] ?? 'grass';
}

function findWangTile(
  meta: { tiles: Array<{ corners: Record<string, string>; bounding_box: { x: number; y: number; width: number; height: number } }> },
  ne: string, nw: string, se: string, sw: string,
): { x: number; y: number; width: number; height: number } | null {
  for (const tile of meta.tiles) {
    if (tile.corners.NE === ne && tile.corners.NW === nw &&
        tile.corners.SE === se && tile.corners.SW === sw) {
      return tile.bounding_box;
    }
  }
  return null;
}

const tileTexCache: Map<string, Texture> = new Map();

const cachedStyles = {
  buildingLabel: new TextStyle({ fontSize: 9, fill: 0xffffff, fontFamily: 'monospace', dropShadow: { color: 0x000000, distance: 1, alpha: 0.8 } }),
  villagerName: new TextStyle({ fontSize: 9, fill: 0xffffff, fontFamily: 'monospace' }),
  villagerNameBold: new TextStyle({ fontSize: 9, fill: 0xffffff, fontFamily: 'monospace', fontWeight: 'bold' }),
  villagerAction: new TextStyle({ fontSize: 8, fill: 0xcccccc, fontFamily: 'monospace' }),
  bubbleText: new TextStyle({ fontSize: 8, fill: 0x1a1a2e, fontFamily: '"Press Start 2P", "Courier New", monospace', wordWrap: true, wordWrapWidth: 130, lineHeight: 14, letterSpacing: -0.5 }),
  mapLabel: new TextStyle({ fontSize: 10, fill: 0xffffff, fontFamily: 'monospace', dropShadow: { color: 0x000000, distance: 1, alpha: 0.8 } }),
};

function drawTileFromSheet(
  container: Container,
  sheetTex: Texture,
  box: { x: number; y: number; width: number; height: number },
  px: number, py: number,
) {
  const cacheKey = `${sheetTex.uid}_${box.x}_${box.y}_${box.width}_${box.height}`;
  let tileTex = tileTexCache.get(cacheKey);
  if (!tileTex) {
    const frame = new Rectangle(box.x, box.y, box.width, box.height);
    tileTex = new Texture({ source: sheetTex.source, frame });
    tileTexCache.set(cacheKey, tileTex);
  }
  const sprite = new Sprite(tileTex);
  sprite.x = px;
  sprite.y = py;
  sprite.width = TILE;
  sprite.height = TILE;
  container.addChild(sprite);
}

function findFullTile(meta: typeof tilesetMeta[string], type: 'upper' | 'lower') {
  return meta?.tiles.find((t) =>
    t.corners.NE === type && t.corners.NW === type && t.corners.SE === type && t.corners.SW === type,
  )?.bounding_box ?? null;
}

function drawMap(container: Container) {
  const waterGrassTex = tilesetTextures['water_grass'];
  const waterGrassMeta = tilesetMeta['water_grass'];
  const grassCobbleTex = tilesetTextures['grass_cobble'];
  const grassCobbleMeta = tilesetMeta['grass_cobble'];
  const grassDirtTex = tilesetTextures['grass_dirt'];
  const grassDirtMeta = tilesetMeta['grass_dirt'];

  const hasWaterTiles = !!(waterGrassTex && waterGrassMeta?.tiles);
  const hasCobbleTiles = !!(grassCobbleTex && grassCobbleMeta?.tiles);
  const hasDirtTiles = !!(grassDirtTex && grassDirtMeta?.tiles);

  const grassBox = hasWaterTiles ? findFullTile(waterGrassMeta, 'upper') : null;
  const waterBox = hasWaterTiles ? findFullTile(waterGrassMeta, 'lower') : null;
  const cobbleBox = hasCobbleTiles ? findFullTile(grassCobbleMeta, 'upper') : null;
  const dirtBox = hasDirtTiles ? findFullTile(grassDirtMeta, 'upper') : null;

  for (let y = 0; y < MAP_DATA.height; y++) {
    for (let x = 0; x < MAP_DATA.width; x++) {
      const px = x * TILE;
      const py = y * TILE;
      const terrain = getTerrain(x, y);

      let drawn = false;

      if (terrain === 'water' && hasWaterTiles && waterBox) {
        const ne = getTerrain(x + 1, y - 1) === 'water' ? 'lower' : 'upper';
        const nw = getTerrain(x - 1, y - 1) === 'water' ? 'lower' : 'upper';
        const se = getTerrain(x + 1, y + 1) === 'water' ? 'lower' : 'upper';
        const sw = getTerrain(x - 1, y + 1) === 'water' ? 'lower' : 'upper';

        const hasAnyGrass = ne === 'upper' || nw === 'upper' || se === 'upper' || sw === 'upper';

        if (hasAnyGrass) {
          const box = findWangTile(waterGrassMeta, ne, nw, se, sw);
          if (box) {
            drawTileFromSheet(container, waterGrassTex, box, px, py);
            drawn = true;
          }
        }

        if (!drawn) {
          drawTileFromSheet(container, waterGrassTex, waterBox, px, py);
          drawn = true;
        }
      }

      if (terrain === 'dirt') {
        if (grassBox && waterGrassTex) {
          drawTileFromSheet(container, waterGrassTex, grassBox, px, py);
        }
        if (dirtBox && grassDirtTex) {
          drawTileFromSheet(container, grassDirtTex, dirtBox, px, py);
        }

        const isDirtOrCobble = (t: TerrainType) => t === 'dirt' || t === 'cobble';
        const blend = new Graphics();
        const bc = 0x4a7c59;
        const bw = 3;
        const ba = 0.5;
        if (!isDirtOrCobble(getTerrain(x, y - 1))) blend.rect(px, py, TILE, bw).fill({ color: bc, alpha: ba });
        if (!isDirtOrCobble(getTerrain(x, y + 1))) blend.rect(px, py + TILE - bw, TILE, bw).fill({ color: bc, alpha: ba });
        if (!isDirtOrCobble(getTerrain(x - 1, y))) blend.rect(px, py, bw, TILE).fill({ color: bc, alpha: ba });
        if (!isDirtOrCobble(getTerrain(x + 1, y))) blend.rect(px + TILE - bw, py, bw, TILE).fill({ color: bc, alpha: ba });
        container.addChild(blend);
        drawn = true;
      }

      if (terrain === 'cobble') {
        const isUnderBuilding = MAP_DATA.buildings.some(
          (b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h && buildingTextures[b.id],
        );

        if (isUnderBuilding) {
          if (grassBox && waterGrassTex) {
            drawTileFromSheet(container, waterGrassTex, grassBox, px, py);
          } else {
            const g = new Graphics();
            g.rect(px, py, TILE, TILE).fill({ color: 0x4a7c59 });
            container.addChild(g);
          }
          drawn = true;
        } else if (cobbleBox && grassCobbleTex) {
          if (grassBox && waterGrassTex) {
            drawTileFromSheet(container, waterGrassTex, grassBox, px, py);
          }
          drawTileFromSheet(container, grassCobbleTex, cobbleBox, px, py);

          const isCobble = (t: TerrainType) => t === 'cobble' || t === 'dirt';
          const blend = new Graphics();
          const bc = 0x4a7c59;
          const bw = 3;
          const ba = 0.4;
          if (!isCobble(getTerrain(x, y - 1))) blend.rect(px, py, TILE, bw).fill({ color: bc, alpha: ba });
          if (!isCobble(getTerrain(x, y + 1))) blend.rect(px, py + TILE - bw, TILE, bw).fill({ color: bc, alpha: ba });
          if (!isCobble(getTerrain(x - 1, y))) blend.rect(px, py, bw, TILE).fill({ color: bc, alpha: ba });
          if (!isCobble(getTerrain(x + 1, y))) blend.rect(px + TILE - bw, py, bw, TILE).fill({ color: bc, alpha: ba });
          container.addChild(blend);
          drawn = true;
        }
      }

      if (terrain === 'bridge' && bridgeTexture) {
        if (grassBox && waterGrassTex) {
          drawTileFromSheet(container, waterGrassTex, grassBox, px, py);
        }
        const bs = new Sprite(bridgeTexture);
        bs.x = px;
        bs.y = py;
        bs.width = TILE;
        bs.height = TILE;
        container.addChild(bs);
        drawn = true;
      }

      if (!drawn) {
        if ((terrain === 'grass' || terrain === 'dirt') && grassBox && waterGrassTex) {
          drawTileFromSheet(container, waterGrassTex, grassBox, px, py);
          if (terrain === 'dirt' && dirtBox && grassDirtTex) {
            drawTileFromSheet(container, grassDirtTex, dirtBox, px, py);
          }
          drawn = true;
        }
      }

      if (!drawn) {
        const fallbackColors: Record<string, number> = {
          water: 0x2471a3,
          cobble: 0x9e8c6c,
          dirt: 0x8b7355,
          grass: 0x4a7c59,
          bridge: 0x8b6914,
        };
        const color = fallbackColors[terrain] ?? 0x4a7c59;
        const g = new Graphics();
        g.rect(px, py, TILE, TILE).fill({ color });
        container.addChild(g);
      }
    }
  }

  for (const b of MAP_DATA.buildings) {
    const hasBuildingSprite = buildingTextures[b.id];
    if (!hasBuildingSprite) {
      const label = new Text({ text: b.label, style: cachedStyles.mapLabel });
      label.x = b.x * TILE + (b.w * TILE) / 2;
      label.y = b.y * TILE + (b.h * TILE) / 2;
      label.anchor.set(0.5);
      container.addChild(label);
    }
  }
}

function drawDecorations(container: Container) {
  for (const dec of MAP_DATA.decorations) {
    const tex = decorationTextures[dec.sprite];
    if (!tex) continue;
    const sprite = new Sprite(tex);
    sprite.x = dec.x * TILE;
    sprite.y = dec.y * TILE;
    sprite.width = dec.w * TILE;
    sprite.height = dec.h * TILE;
    container.addChild(sprite);
  }
}

function drawBuildings(container: Container, villagers: Villager[]) {
  for (const b of MAP_DATA.buildings) {
    const tex = buildingTextures[b.id];
    if (!tex) continue;

    const sprite = new Sprite(tex);
    sprite.x = b.x * TILE;
    sprite.y = b.y * TILE;
    sprite.width = b.w * TILE;
    sprite.height = b.h * TILE;

    const hasVillagerInside = villagers.some((v) => {
      const vx = v.state.x;
      const vy = v.state.y;
      return vx >= b.x && vx < b.x + b.w && vy >= b.y && vy < b.y + b.h;
    });

    sprite.alpha = hasVillagerInside ? 0.35 : 0.9;
    container.addChild(sprite);

    const label = new Text({ text: b.label, style: cachedStyles.buildingLabel });
    label.x = b.x * TILE + (b.w * TILE) / 2;
    label.y = b.y * TILE + 4;
    label.anchor.set(0.5, 0);
    label.alpha = hasVillagerInside ? 0.5 : 1;
    container.addChild(label);
  }
}

function drawVillager(
  container: Container,
  labelsContainer: Container,
  villager: Villager,
  isSelected: boolean,
  now: number,
) {
  const { x, y } = villager.state;
  const px = x * TILE;
  const py = y * TILE;
  const id = villager.profile.id;
  const facing = villager.state.facing;
  const dirKey = DIRECTION_MAP[facing] ?? 'south';
  const isWalking = villager.state.isMoving;

  const shadow = new Graphics();
  shadow.ellipse(px, py + TILE * 0.35, TILE * 0.35, TILE * 0.12).fill({ color: 0x000000, alpha: 0.2 });
  container.addChild(shadow);

  if (isSelected) {
    const selection = new Graphics();
    selection.circle(px, py, TILE * 0.6).fill({ color: 0xffffff, alpha: 0.25 });
    selection.circle(px, py, TILE * 0.6).stroke({ color: 0xffffff, width: 1, alpha: 0.5 });
    container.addChild(selection);
  }

  let texture: Texture | null = null;

  if (isWalking) {
    texture = getWalkFrame(id, dirKey, now);
  }

  if (!texture) {
    texture = spriteTextures[`${id}_${dirKey}`] ?? null;
  }

  if (texture) {
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5, 0.5);
    sprite.x = px;
    sprite.y = py;
    sprite.width = TILE * 1.4;
    sprite.height = TILE * 1.4;
    container.addChild(sprite);
  } else {
    const color = VILLAGER_COLORS[id] ?? 0xffffff;
    const g = new Graphics();
    g.circle(px, py, TILE * 0.4).fill({ color });
    g.circle(px, py, TILE * 0.4).stroke({ color: 0x000000, width: 1 });
    container.addChild(g);
  }

  const nameLabel = new Text({ text: villager.profile.name, style: isSelected ? cachedStyles.villagerNameBold : cachedStyles.villagerName });
  nameLabel.x = px;
  nameLabel.y = py - TILE * 0.85;
  nameLabel.anchor.set(0.5);
  labelsContainer.addChild(nameLabel);

  if (isSelected && villager.state.currentAction) {
    const actionLabel = ACTION_LABELS[villager.state.currentAction.type] ?? '';
    const actionText = new Text({ text: actionLabel, style: cachedStyles.villagerAction });
    actionText.x = px;
    actionText.y = py + TILE * 0.8;
    actionText.anchor.set(0.5);
    labelsContainer.addChild(actionText);
  }
}

function updateLighting(overlay: Graphics, hour: number) {
  overlay.clear();

  let color: number;
  let alpha: number;

  if (hour >= 5 && hour < 7) {
    color = 0xFFCC88;
    alpha = 0.15;
  } else if (hour >= 7 && hour < 16) {
    color = 0x000000;
    alpha = 0.0;
  } else if (hour >= 16 && hour < 19) {
    color = 0xFF8844;
    const t = (hour - 16) / 3;
    alpha = t * 0.25;
  } else if (hour >= 19 && hour < 21) {
    color = 0x332255;
    const t = (hour - 19) / 2;
    alpha = 0.2 + t * 0.25;
  } else {
    color = 0x1a1a3e;
    alpha = 0.45;
  }

  if (alpha > 0) {
    overlay.rect(0, 0, MAP_DATA.width * TILE, MAP_DATA.height * TILE).fill({ color, alpha });
  }
}

function drawSpeechBubble(
  container: Container,
  villager: Villager,
  text: string,
  alpha: number,
) {
  const px = villager.state.x * TILE;
  const py = villager.state.y * TILE;

  const textObj = new Text({ text, style: cachedStyles.bubbleText });
  textObj.anchor.set(0.5, 1);

  const textWidth = textObj.width;
  const textHeight = textObj.height;
  const padX = 8;
  const padY = 6;
  const bw = 2;
  const bubbleW = textWidth + padX * 2;
  const bubbleH = textHeight + padY * 2;
  const bubbleX = px - bubbleW / 2;
  const bubbleY = py - TILE * 1.4 - bubbleH;

  const bg = new Graphics();
  bg.alpha = alpha;

  // 8-bit style: sharp corners with pixel border
  bg.rect(bubbleX + bw, bubbleY, bubbleW - bw * 2, bubbleH).fill({ color: 0xf8f8f0 });
  bg.rect(bubbleX, bubbleY + bw, bubbleW, bubbleH - bw * 2).fill({ color: 0xf8f8f0 });

  // Pixel border — top
  bg.rect(bubbleX + bw, bubbleY, bubbleW - bw * 2, bw).fill({ color: 0x222034 });
  // Bottom
  bg.rect(bubbleX + bw, bubbleY + bubbleH - bw, bubbleW - bw * 2, bw).fill({ color: 0x222034 });
  // Left
  bg.rect(bubbleX, bubbleY + bw, bw, bubbleH - bw * 2).fill({ color: 0x222034 });
  // Right
  bg.rect(bubbleX + bubbleW - bw, bubbleY + bw, bw, bubbleH - bw * 2).fill({ color: 0x222034 });

  // Pixel pointer (staircase style)
  const ptX = px - 3;
  const ptY = bubbleY + bubbleH;
  bg.rect(ptX, ptY, 6, bw).fill({ color: 0xf8f8f0 });
  bg.rect(ptX + 1, ptY + bw, 4, bw).fill({ color: 0xf8f8f0 });
  bg.rect(ptX + 2, ptY + bw * 2, 2, bw).fill({ color: 0xf8f8f0 });
  // Pointer border
  bg.rect(ptX - bw, ptY, bw, bw).fill({ color: 0x222034 });
  bg.rect(ptX + 6, ptY, bw, bw).fill({ color: 0x222034 });
  bg.rect(ptX - 1, ptY + bw, bw, bw).fill({ color: 0x222034 });
  bg.rect(ptX + 5, ptY + bw, bw, bw).fill({ color: 0x222034 });
  bg.rect(ptX, ptY + bw * 2, bw, bw).fill({ color: 0x222034 });
  bg.rect(ptX + 4, ptY + bw * 2, bw, bw).fill({ color: 0x222034 });
  bg.rect(ptX + 1, ptY + bw * 3, 4, bw).fill({ color: 0x222034 });

  container.addChild(bg);

  textObj.x = px;
  textObj.y = bubbleY + bubbleH - padY;
  textObj.alpha = alpha;
  container.addChild(textObj);
}
