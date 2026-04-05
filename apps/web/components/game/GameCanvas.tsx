'use client';

import { useEffect, useRef, useState } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { useGameStore } from '@/stores/gameStore';
import type { SpeechBubble } from '@/stores/gameStore';
import { useUIStore } from '@/stores/uiStore';
import { initializeGame } from '@/lib/initGame';
import { MAP_DATA } from '@/lib/mapData';
import { ACTION_LABELS } from '@ai-crossing/shared';
import type { Villager } from '@ai-crossing/shared';

const TILE = MAP_DATA.tileSize;
const VILLAGER_COLORS: Record<string, number> = {
  maple: 0xff6b6b,
  jasper: 0x51cf66,
  luna: 0x845ef7,
  rowan: 0xff922b,
  sage: 0x20c997,
  felix: 0xfcc419,
};

const GROUND_COLORS: Record<number, number> = {
  1: 0x4a7c59,
  2: 0x3d6b4e,
  3: 0x2980b9,
  4: 0x8b6914,
};

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

      drawMap(worldContainer);
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

    const villagersContainer = new Container();
    villagersContainer.label = 'villagers';
    world.addChild(villagersContainer);

    const labelsContainer = new Container();
    labelsContainer.label = 'labels';
    world.addChild(labelsContainer);

    const bubblesContainer = new Container();
    bubblesContainer.label = 'bubbles';
    world.addChild(bubblesContainer);

    const ticker = () => {
      const { villagers, speechBubbles } = useGameStore.getState();
      const { selectedVillagerId } = useUIStore.getState();

      villagersContainer.removeChildren();
      labelsContainer.removeChildren();
      bubblesContainer.removeChildren();

      for (const v of villagers) {
        drawVillager(villagersContainer, labelsContainer, v, v.profile.id === selectedVillagerId);
      }

      const now = Date.now();
      for (const bubble of speechBubbles) {
        if (now >= bubble.expiresAt) continue;
        if (now < bubble.createdAt) continue;

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
      world.removeChild(villagersContainer);
      world.removeChild(labelsContainer);
      world.removeChild(bubblesContainer);
    };
  }, [ready]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const world = worldContainerRef.current;
      if (!world) return;
      const scaleDelta = e.deltaY > 0 ? 0.9 : 1.1;
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

function drawMap(container: Container) {
  const ground = new Graphics();

  for (let y = 0; y < MAP_DATA.height; y++) {
    for (let x = 0; x < MAP_DATA.width; x++) {
      const tileIdx = y * MAP_DATA.width + x;
      const tileType = MAP_DATA.groundTiles[tileIdx] ?? 1;
      const color = GROUND_COLORS[tileType] ?? 0x4a7c59;
      ground.rect(x * TILE, y * TILE, TILE, TILE).fill({ color });
    }
  }

  container.addChild(ground);

  for (const b of MAP_DATA.buildings) {
    const bldg = new Graphics();
    bldg.rect(b.x * TILE, b.y * TILE, b.w * TILE, b.h * TILE).fill({ color: b.color, alpha: 0.8 });
    bldg.rect(b.x * TILE, b.y * TILE, b.w * TILE, b.h * TILE).stroke({ color: 0x000000, width: 1, alpha: 0.3 });
    container.addChild(bldg);

    const labelStyle = new TextStyle({
      fontSize: 10,
      fill: 0xffffff,
      fontFamily: 'monospace',
    });
    const label = new Text({ text: b.label, style: labelStyle });
    label.x = b.x * TILE + (b.w * TILE) / 2;
    label.y = b.y * TILE + (b.h * TILE) / 2;
    label.anchor.set(0.5);
    container.addChild(label);
  }
}

function drawVillager(
  container: Container,
  labelsContainer: Container,
  villager: Villager,
  isSelected: boolean,
) {
  const { x, y } = villager.state;
  const px = x * TILE;
  const py = y * TILE;
  const color = VILLAGER_COLORS[villager.profile.id] ?? 0xffffff;

  const g = new Graphics();

  if (isSelected) {
    g.circle(px, py, TILE * 0.55).fill({ color: 0xffffff, alpha: 0.3 });
  }

  g.circle(px, py, TILE * 0.4).fill({ color });
  g.circle(px, py, TILE * 0.4).stroke({ color: 0x000000, width: 1 });

  const eyeOffset = villager.state.facing === 'left' ? -3 : villager.state.facing === 'right' ? 3 : 0;
  const eyeY = villager.state.facing === 'up' ? -4 : villager.state.facing === 'down' ? 2 : -1;
  g.circle(px + eyeOffset - 3, py + eyeY, 2).fill({ color: 0x000000 });
  g.circle(px + eyeOffset + 3, py + eyeY, 2).fill({ color: 0x000000 });

  container.addChild(g);

  const nameStyle = new TextStyle({
    fontSize: 9,
    fill: 0xffffff,
    fontFamily: 'monospace',
    fontWeight: isSelected ? 'bold' : 'normal',
  });
  const nameLabel = new Text({ text: villager.profile.name, style: nameStyle });
  nameLabel.x = px;
  nameLabel.y = py - TILE * 0.7;
  nameLabel.anchor.set(0.5);
  labelsContainer.addChild(nameLabel);

  if (isSelected && villager.state.currentAction) {
    const actionLabel = ACTION_LABELS[villager.state.currentAction.type] ?? '';
    const actionStyle = new TextStyle({
      fontSize: 8,
      fill: 0xcccccc,
      fontFamily: 'monospace',
    });
    const actionText = new Text({ text: actionLabel, style: actionStyle });
    actionText.x = px;
    actionText.y = py + TILE * 0.65;
    actionText.anchor.set(0.5);
    labelsContainer.addChild(actionText);
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

  const textStyle = new TextStyle({
    fontSize: 9,
    fill: 0x1a1a2e,
    fontFamily: 'sans-serif',
    wordWrap: true,
    wordWrapWidth: 120,
    lineHeight: 12,
  });

  const textObj = new Text({ text, style: textStyle });
  textObj.anchor.set(0.5, 1);

  const textWidth = textObj.width;
  const textHeight = textObj.height;
  const padX = 8;
  const padY = 5;
  const bubbleW = textWidth + padX * 2;
  const bubbleH = textHeight + padY * 2;
  const bubbleX = px - bubbleW / 2;
  const bubbleY = py - TILE * 1.2 - bubbleH;
  const pointerSize = 5;

  const bg = new Graphics();
  bg.alpha = alpha;

  bg.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 6).fill({ color: 0xffffff });
  bg.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 6).stroke({ color: 0xcccccc, width: 1 });

  bg.moveTo(px - pointerSize, bubbleY + bubbleH);
  bg.lineTo(px, bubbleY + bubbleH + pointerSize);
  bg.lineTo(px + pointerSize, bubbleY + bubbleH);
  bg.closePath();
  bg.fill({ color: 0xffffff });

  container.addChild(bg);

  textObj.x = px;
  textObj.y = bubbleY + bubbleH - padY;
  textObj.alpha = alpha;
  container.addChild(textObj);
}
