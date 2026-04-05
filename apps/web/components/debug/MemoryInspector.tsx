'use client';

interface Props {
  villagerId: string;
  memories: Array<{
    id: string;
    type: string;
    summary: string;
    importance: number;
    timestamp: number;
  }>;
}

export function MemoryInspector({ villagerId, memories }: Props) {
  return (
    <div className="p-3 space-y-2">
      <h4 className="text-xs font-bold text-[var(--color-text-dim)] uppercase">
        Memories — {villagerId}
      </h4>
      {memories.length === 0 && (
        <p className="text-xs text-[var(--color-text-dim)]">No memories yet</p>
      )}
      {memories.map((m) => (
        <div
          key={m.id}
          className="text-xs p-2 bg-[var(--color-bg-card)] rounded border border-[var(--color-border)]"
        >
          <div className="flex justify-between">
            <span className="text-[var(--color-accent)] capitalize">{m.type}</span>
            <span className="text-[var(--color-text-dim)]">
              imp: {m.importance.toFixed(1)}
            </span>
          </div>
          <p className="mt-1">{m.summary}</p>
        </div>
      ))}
    </div>
  );
}
