'use client';

import type { Villager } from '@ai-crossing/shared';
import { ACTION_LABELS } from '@ai-crossing/shared';
import { getAgent } from '@/lib/villagerAgent';
import type { AgentDebugInfo } from '@/lib/villagerAgent';
import { useState, useEffect } from 'react';

interface Props {
  villager: Villager;
}

function NeedBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-[var(--color-text-dim)]">{label}</span>
      <div className="flex-1 h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 text-right font-mono">{Math.round(value)}</span>
    </div>
  );
}

export function VillagerPanel({ villager }: Props) {
  const { profile, state } = villager;
  const actionLabel = state.currentAction ? ACTION_LABELS[state.currentAction.type] : 'Idle';

  const [agentDebug, setAgentDebug] = useState<AgentDebugInfo | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const agent = getAgent(profile.id);
      if (agent) setAgentDebug(agent.getDebugInfo());
    }, 500);
    return () => clearInterval(interval);
  }, [profile.id]);

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base">{profile.name}</h3>
          <p className="text-xs text-[var(--color-text-dim)] capitalize">
            {profile.job} · {state.mood}
          </p>
        </div>
        <div className="text-xs text-right text-[var(--color-text-dim)]">
          <div>{state.currentLocation.replace(/_/g, ' ')}</div>
          <div className="text-[var(--color-accent)]">{actionLabel}</div>
        </div>
      </div>

      <div className="space-y-1">
        <NeedBar label="Hunger" value={state.hunger} color="#ef4444" />
        <NeedBar label="Energy" value={state.energy} color="#22c55e" />
        <NeedBar label="Stress" value={state.stress} color="#f59e0b" />
        <NeedBar label="Boredom" value={state.boredom} color="#8b5cf6" />
        <NeedBar label="Social" value={state.sociability} color="#3b82f6" />
      </div>

      {agentDebug && (
        <div className="space-y-1.5 border-t border-[var(--color-border)] pt-2">
          {agentDebug.lastThought && (
            <div className="text-xs">
              <span className="text-[var(--color-accent)]">Thinking: </span>
              <span className="italic text-[var(--color-text-dim)]">&quot;{agentDebug.lastThought}&quot;</span>
            </div>
          )}
          {agentDebug.currentIntention && (
            <div className="text-xs">
              <span className="text-[var(--color-text-dim)]">Intention: </span>
              {agentDebug.currentIntention}
            </div>
          )}
          <div className="text-xs text-[var(--color-text-dim)] flex gap-3">
            <span>Thinks: {agentDebug.thinkCount}</span>
            <span>Facts: {agentDebug.memoryFactCount}</span>
            <span>Memories: {agentDebug.memoryEpisodeCount}</span>
            {agentDebug.isThinking && <span className="text-[var(--color-warning)] animate-pulse">thinking...</span>}
          </div>
          {agentDebug.planItems.length > 0 && (
            <div className="text-xs">
              <span className="text-[var(--color-text-dim)]">Plan:</span>
              {agentDebug.planItems.map((item, i) => (
                <div key={i} className="pl-2 text-[var(--color-text-dim)]">• {item}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-[var(--color-text-dim)]">
        <span className="text-[var(--color-text)]">Traits: </span>
        {profile.traits.join(', ')}
      </div>

      {Object.keys(state.relationshipMap).length > 0 && (
        <div className="text-xs space-y-0.5">
          <span className="text-[var(--color-text-dim)]">Relationships:</span>
          {Object.entries(state.relationshipMap).map(([id, score]) => (
            <div key={id} className="flex justify-between pl-2">
              <span>{id}</span>
              <span className={score >= 0 ? 'text-green-400' : 'text-red-400'}>{score > 0 ? '+' : ''}{score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
