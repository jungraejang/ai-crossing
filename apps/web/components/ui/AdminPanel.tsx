'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import type { Weather, SimulationSpeed } from '@ai-crossing/shared';

export function AdminPanel() {
  const villagers = useGameStore((s) => s.villagers);
  const world = useGameStore((s) => s.world);
  const setWeather = useGameStore((s) => s.setWeather);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const updateVillager = useGameStore((s) => s.updateVillager);
  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null);

  const weatherOptions: Weather[] = ['clear', 'cloudy', 'rain', 'storm'];
  const speedOptions: SimulationSpeed[] = [1, 4, 16];

  const teleportVillager = (villagerId: string, x: number, y: number) => {
    updateVillager(villagerId, {
      x,
      y,
      targetDestination: null,
      path: [],
      isMoving: false,
    });
  };

  const setMood = (villagerId: string, mood: string) => {
    updateVillager(villagerId, { mood: mood as ReturnType<() => 'happy'> });
  };

  const resetNeeds = (villagerId: string) => {
    updateVillager(villagerId, {
      hunger: 30,
      energy: 90,
      stress: 10,
      boredom: 20,
      sociability: 40,
    });
  };

  return (
    <div className="p-3 space-y-3">
      <h4 className="text-xs font-bold text-[var(--color-text-dim)] uppercase">Admin Controls</h4>

      <div className="space-y-2">
        <div className="text-xs font-bold">World</div>
        <div className="flex gap-1 flex-wrap">
          {weatherOptions.map((w) => (
            <button
              key={w}
              onClick={() => setWeather(w)}
              className={`text-[10px] px-2 py-0.5 rounded capitalize ${
                world.weather === w
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-bg-card)] hover:bg-[var(--color-accent-soft)]'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {speedOptions.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`text-[10px] px-2 py-0.5 rounded ${
                world.speed === s
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-bg-card)] hover:bg-[var(--color-accent-soft)]'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-xs font-bold">Villagers</div>
        {villagers.map((v) => (
          <div key={v.profile.id}>
            <button
              onClick={() => setSelectedAdmin(selectedAdmin === v.profile.id ? null : v.profile.id)}
              className="text-xs w-full text-left p-1.5 bg-[var(--color-bg-card)] rounded hover:bg-[var(--color-accent-soft)] border border-[var(--color-border)]"
            >
              {v.profile.name} — {v.state.mood}
            </button>
            {selectedAdmin === v.profile.id && (
              <div className="ml-2 mt-1 space-y-1">
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => resetNeeds(v.profile.id)}
                    className="text-[10px] px-2 py-0.5 bg-[var(--color-success)] text-black rounded"
                  >
                    Reset Needs
                  </button>
                  <button
                    onClick={() => setMood(v.profile.id, 'happy')}
                    className="text-[10px] px-2 py-0.5 bg-[var(--color-warning)] text-black rounded"
                  >
                    Happy
                  </button>
                  <button
                    onClick={() => setMood(v.profile.id, 'angry')}
                    className="text-[10px] px-2 py-0.5 bg-[var(--color-danger)] text-white rounded"
                  >
                    Angry
                  </button>
                  <button
                    onClick={() => teleportVillager(v.profile.id, 20, 14)}
                    className="text-[10px] px-2 py-0.5 bg-[var(--color-accent-soft)] text-white rounded"
                  >
                    To Square
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
