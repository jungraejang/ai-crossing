'use client';

import { useGameStore } from '@/stores/gameStore';
import { useUIStore } from '@/stores/uiStore';
import type { SimulationSpeed } from '@ai-crossing/shared';
import { getTimeOfDay } from '@ai-crossing/shared';

const SPEED_OPTIONS: SimulationSpeed[] = [1, 4, 16];

const WEATHER_ICONS: Record<string, string> = {
  clear: '☀️',
  cloudy: '☁️',
  rain: '🌧️',
  storm: '⛈️',
};

export function TimeControls() {
  const time = useGameStore((s) => s.world.time);
  const speed = useGameStore((s) => s.world.speed);
  const isPaused = useGameStore((s) => s.world.isPaused);
  const weather = useGameStore((s) => s.world.weather);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const togglePause = useGameStore((s) => s.togglePause);
  const toggleDebug = useUIStore((s) => s.toggleDebug);
  const showDebug = useUIStore((s) => s.showDebug);

  const timeStr = `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
  const tod = getTimeOfDay(time.hour);

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-[var(--color-text-dim)]">Day {time.day}</span>
      <span className="font-mono font-bold">{timeStr}</span>
      <span className="text-[var(--color-text-dim)] capitalize text-xs">{tod}</span>
      <span>{WEATHER_ICONS[weather] ?? ''}</span>

      <div className="flex items-center gap-1 ml-2">
        <button
          onClick={togglePause}
          className="px-2 py-0.5 rounded text-xs bg-[var(--color-bg-card)] hover:bg-[var(--color-accent)] transition-colors"
        >
          {isPaused ? '▶' : '⏸'}
        </button>
        {SPEED_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-2 py-0.5 rounded text-xs transition-colors ${
              speed === s && !isPaused
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-bg-card)] hover:bg-[var(--color-accent-soft)]'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      <button
        onClick={toggleDebug}
        className={`ml-2 px-2 py-0.5 rounded text-xs transition-colors ${
          showDebug
            ? 'bg-[var(--color-accent-soft)] text-white'
            : 'bg-[var(--color-bg-card)] hover:bg-[var(--color-accent-soft)]'
        }`}
      >
        Debug
      </button>
    </div>
  );
}
