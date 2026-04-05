'use client';

import { useGameStore } from '@/stores/gameStore';
import { ACTION_LABELS } from '@ai-crossing/shared';
import { getAgent } from '@/lib/villagerAgent';
import { useState, useEffect } from 'react';
import type { AgentDebugInfo } from '@/lib/villagerAgent';

export function GoalInspector() {
  const villagers = useGameStore((s) => s.villagers);
  const [agentInfos, setAgentInfos] = useState<Record<string, AgentDebugInfo>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      const infos: Record<string, AgentDebugInfo> = {};
      for (const v of villagers) {
        const agent = getAgent(v.profile.id);
        if (agent) infos[v.profile.id] = agent.getDebugInfo();
      }
      setAgentInfos(infos);
    }, 1000);
    return () => clearInterval(interval);
  }, [villagers]);

  return (
    <div className="p-3 space-y-2">
      <h4 className="text-xs font-bold text-[var(--color-text-dim)] uppercase">
        Agent States
      </h4>
      {villagers.map((v) => {
        const info = agentInfos[v.profile.id];
        return (
          <div
            key={v.profile.id}
            className="text-xs p-2 bg-[var(--color-bg-card)] rounded border border-[var(--color-border)]"
          >
            <div className="flex justify-between">
              <span className="font-bold text-[var(--color-accent)]">{v.profile.name}</span>
              <span className="text-[var(--color-text-dim)]">
                {v.state.mood} · {info?.isThinking ? '🧠' : ''} thinks: {info?.thinkCount ?? 0}
              </span>
            </div>
            <div className="mt-1 text-[var(--color-text-dim)]">
              <div>
                Action: {v.state.currentAction ? ACTION_LABELS[v.state.currentAction.type] : 'Idle'}
                {' · '}Location: {v.state.currentLocation.replace(/_/g, ' ')}
              </div>
              {info?.currentIntention && (
                <div>Intention: <span className="text-[var(--color-text)]">{info.currentIntention}</span></div>
              )}
              {info?.lastThought && (
                <div className="italic mt-0.5">&quot;{info.lastThought}&quot;</div>
              )}
              <div className="mt-0.5 flex gap-2">
                <span>Facts: {info?.memoryFactCount ?? 0}</span>
                <span>Episodes: {info?.memoryEpisodeCount ?? 0}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
