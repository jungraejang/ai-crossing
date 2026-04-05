'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import type { GameEventLog } from '@ai-crossing/shared';

export function EventReplay() {
  const events = useGameStore((s) => s.eventLog);
  const villagers = useGameStore((s) => s.villagers);
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const perPage = 20;

  const getName = (id: string) =>
    villagers.find((v) => v.profile.id === id)?.profile.name ?? id;

  const eventTypes = ['all', ...new Set(events.map((e) => e.event.type))];

  const filtered =
    filter === 'all' ? events : events.filter((e) => e.event.type === filter);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageEvents = filtered
    .slice()
    .reverse()
    .slice(page * perPage, (page + 1) * perPage);

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-[var(--color-text-dim)] uppercase">
          Event Replay ({filtered.length} events)
        </h4>
      </div>

      <div className="flex gap-1 flex-wrap">
        {eventTypes.map((t) => (
          <button
            key={t}
            onClick={() => { setFilter(t); setPage(0); }}
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              filter === t
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-bg-card)]'
            }`}
          >
            {t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="space-y-1 max-h-80 overflow-y-auto">
        {pageEvents.map((e) => (
          <EventRow key={e.id} event={e} getName={getName} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-xs">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-2 py-0.5 bg-[var(--color-bg-card)] rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-[var(--color-text-dim)]">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-2 py-0.5 bg-[var(--color-bg-card)] rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function EventRow({
  event,
  getName,
}: {
  event: GameEventLog;
  getName: (id: string) => string;
}) {
  const e = event.event as unknown as Record<string, unknown>;
  const timeStr = `D${event.gameTime.day} ${String(event.gameTime.hour).padStart(2, '0')}:${String(event.gameTime.minute).padStart(2, '0')}`;

  return (
    <div className="text-[11px] p-1.5 bg-[var(--color-bg-card)] rounded border border-[var(--color-border)]">
      <div className="flex justify-between">
        <span className="text-[var(--color-accent)] font-mono">{e.type as string}</span>
        <span className="text-[var(--color-text-dim)] font-mono">{timeStr}</span>
      </div>
      <div className="text-[var(--color-text-dim)] mt-0.5">
        {typeof e.villagerId === 'string' && <span>{getName(e.villagerId)} </span>}
        {typeof e.areaTag === 'string' && <span>@ {e.areaTag} </span>}
        {typeof e.seenId === 'string' && <span>saw {getName(e.seenId)} </span>}
        {typeof e.message === 'string' && <span>&quot;{e.message}&quot; </span>}
      </div>
    </div>
  );
}
