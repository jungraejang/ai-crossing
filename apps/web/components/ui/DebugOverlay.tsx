'use client';

import { useGameStore } from '@/stores/gameStore';
import { useDebugStore } from '@/stores/debugStore';

export function DebugOverlay() {
  const villagers = useGameStore((s) => s.villagers);
  const world = useGameStore((s) => s.world);
  const { showGoals, showRelationships, aiLogs, toggleGoals, toggleRelationships } =
    useDebugStore();

  return (
    <div className="absolute top-2 left-2 bg-[var(--color-bg-panel)] bg-opacity-95 rounded-lg p-3 text-xs max-w-80 max-h-[60vh] overflow-y-auto border border-[var(--color-border)] space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-bold text-[var(--color-accent)]">Debug Panel</span>
        <div className="flex gap-1">
          <button
            onClick={toggleGoals}
            className={`px-1.5 py-0.5 rounded ${showGoals ? 'bg-[var(--color-accent-soft)]' : 'bg-[var(--color-bg-card)]'}`}
          >
            Goals
          </button>
          <button
            onClick={toggleRelationships}
            className={`px-1.5 py-0.5 rounded ${showRelationships ? 'bg-[var(--color-accent-soft)]' : 'bg-[var(--color-bg-card)]'}`}
          >
            Rels
          </button>
        </div>
      </div>

      <div className="text-[var(--color-text-dim)]">
        Speed: {world.speed}x | Weather: {world.weather} | Villagers: {villagers.length}
      </div>

      {showGoals && (
        <div className="space-y-1">
          <div className="font-bold">Villager States</div>
          {villagers.map((v) => (
            <div key={v.profile.id} className="pl-2 border-l border-[var(--color-border)]">
              <span className="text-[var(--color-accent)]">{v.profile.name}</span>
              <span className="text-[var(--color-text-dim)]"> @ {v.state.currentLocation}</span>
              <div className="text-[var(--color-text-dim)]">
                Action: {v.state.currentAction?.type ?? 'idle'} | Mood: {v.state.mood}
              </div>
              <div className="text-[var(--color-text-dim)]">
                pos: ({v.state.x.toFixed(1)}, {v.state.y.toFixed(1)}) | dest: {v.state.targetDestination ?? 'none'}
              </div>
            </div>
          ))}
        </div>
      )}

      {showRelationships && (
        <div className="space-y-1">
          <div className="font-bold">Relationships</div>
          {villagers.map((v) => {
            const rels = Object.entries(v.state.relationshipMap);
            if (rels.length === 0) return null;
            return (
              <div key={v.profile.id} className="pl-2">
                <span className="text-[var(--color-accent)]">{v.profile.name}</span>
                {rels.map(([id, score]) => (
                  <span key={id} className={`ml-1 ${score >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {id}:{score}
                  </span>
                ))}
              </div>
            );
          })}
          {villagers.every((v) => Object.keys(v.state.relationshipMap).length === 0) && (
            <div className="text-[var(--color-text-dim)]">No relationships yet</div>
          )}
        </div>
      )}

      {aiLogs.length > 0 && (
        <div className="space-y-1">
          <div className="font-bold">Recent AI Calls</div>
          {aiLogs.slice(-5).reverse().map((log) => (
            <div key={log.id} className="pl-2 border-l border-[var(--color-border)] text-[var(--color-text-dim)]">
              {log.type} for {log.villagerId} ({log.durationMs}ms)
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
