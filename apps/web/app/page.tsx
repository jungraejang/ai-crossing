'use client';

import dynamic from 'next/dynamic';
import { TimeControls } from '@/components/ui/TimeControls';
import { VillagerPanel } from '@/components/ui/VillagerPanel';
import { ChatPanel } from '@/components/ui/ChatPanel';
import { EventFeed } from '@/components/ui/EventFeed';
import { DebugOverlay } from '@/components/ui/DebugOverlay';
import { useGameStore } from '@/stores/gameStore';
import { useUIStore } from '@/stores/uiStore';
import { useGameLoop } from '@/hooks/useGameLoop';

const GameCanvas = dynamic(() => import('@/components/game/GameCanvas').then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[var(--color-bg)]">
      <p className="text-[var(--color-text-dim)]">Loading village...</p>
    </div>
  ),
});

export default function HomePage() {
  useGameLoop();
  const selectedVillagerId = useUIStore((s) => s.selectedVillagerId);
  const showDebug = useUIStore((s) => s.showDebug);
  const showChat = useUIStore((s) => s.showChat);
  const villagers = useGameStore((s) => s.villagers);
  const selectedVillager = selectedVillagerId
    ? villagers.find((v) => v.profile.id === selectedVillagerId)
    : null;

  return (
    <div className="h-screen w-screen flex flex-col">
      <header className="h-12 flex items-center justify-between px-4 bg-[var(--color-bg-panel)] border-b border-[var(--color-border)] shrink-0">
        <h1 className="text-lg font-bold tracking-wide">
          <span className="text-[var(--color-accent)]">AI</span> Crossing
        </h1>
        <TimeControls />
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 relative">
          <GameCanvas />
          {showDebug && <DebugOverlay />}
        </main>

        <aside className="w-80 flex flex-col bg-[var(--color-bg-panel)] border-l border-[var(--color-border)] shrink-0">
          {selectedVillager && (
            <div className="border-b border-[var(--color-border)]">
              <VillagerPanel villager={selectedVillager} />
            </div>
          )}

          {showChat && selectedVillager && (
            <div className="border-b border-[var(--color-border)] flex-1 min-h-0">
              <ChatPanel villager={selectedVillager} />
            </div>
          )}

          <div className="flex-1 min-h-0">
            <EventFeed />
          </div>
        </aside>
      </div>
    </div>
  );
}
