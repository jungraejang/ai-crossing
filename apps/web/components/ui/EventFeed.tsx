'use client';

import { useGameStore } from '@/stores/gameStore';

const EVENT_LABELS: Record<string, (e: Record<string, unknown>, getName: (id: string) => string) => string> = {
  ENTER_AREA: (e, getName) => `${getName(e.villagerId as string)} entered ${(e.areaTag as string)?.replace(/_/g, ' ')}`,
  START_ACTION: (e, getName) => `${getName(e.villagerId as string)} started ${(e.action as Record<string, string>)?.type}`,
  COMPLETE_ACTION: (e, getName) => `${getName(e.villagerId as string)} finished ${(e.action as Record<string, string>)?.type}`,
  SEE_CHARACTER: (e, getName) => `${getName(e.villagerId as string)} noticed ${getName(e.seenId as string)}`,
  PLAYER_TALK: (e, getName) => `Player said to ${getName(e.villagerId as string)}: "${e.message}"`,
  SOCIAL_INVITE: (e, getName) => `${getName(e.fromId as string)} interacted with ${getName(e.toId as string)}`,
  CONFLICT_TRIGGER: (e) => `Conflict: ${e.cause}`,
  MEMORY_CREATED: (e, getName) => `${getName(e.villagerId as string)} formed a memory`,
  WORLD_STATE_CHANGED: () => `World changed`,
};

export function EventFeed() {
  const events = useGameStore((s) => s.eventLog);
  const villagers = useGameStore((s) => s.villagers);

  const getName = (id: string) =>
    villagers.find((v) => v.profile.id === id)?.profile.name ?? id;

  const visibleEvents = events
    .filter((e) => e.event.type !== 'TIME_TICK')
    .slice(-50)
    .reverse();

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 text-xs font-bold text-[var(--color-text-dim)] uppercase tracking-wide border-b border-[var(--color-border)]">
        Events ({visibleEvents.length})
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
        {visibleEvents.length === 0 && (
          <p className="text-xs text-[var(--color-text-dim)] py-2">No events yet. Unpause to start.</p>
        )}
        {visibleEvents.map((e) => {
          const event = e.event as unknown as Record<string, unknown>;
          const type = event.type as string;
          const labelFn = EVENT_LABELS[type];
          const label = labelFn ? labelFn(event, getName) : null;
          if (!label) return null;

          const timeStr = `${String(e.gameTime.hour).padStart(2, '0')}:${String(e.gameTime.minute).padStart(2, '0')}`;

          const isInteraction = type === 'SOCIAL_INVITE';
          const isSighting = type === 'SEE_CHARACTER';

          return (
            <div key={e.id} className="text-xs flex gap-2">
              <span className="text-[var(--color-text-dim)] font-mono shrink-0">{timeStr}</span>
              <span className={isInteraction ? 'text-[var(--color-success)]' : isSighting ? 'text-[var(--color-text-dim)]' : ''}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
