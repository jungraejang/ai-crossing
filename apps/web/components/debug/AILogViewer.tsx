'use client';

import { useDebugStore } from '@/stores/debugStore';

export function AILogViewer() {
  const { aiLogs, clearAILogs } = useDebugStore();

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-[var(--color-text-dim)] uppercase">
          AI Logs ({aiLogs.length})
        </h4>
        <button
          onClick={clearAILogs}
          className="text-xs px-2 py-0.5 bg-[var(--color-bg-card)] rounded hover:bg-[var(--color-accent-soft)]"
        >
          Clear
        </button>
      </div>
      {aiLogs.length === 0 && (
        <p className="text-xs text-[var(--color-text-dim)]">No AI calls yet</p>
      )}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {[...aiLogs].reverse().map((log) => (
          <div
            key={log.id}
            className="text-xs p-2 bg-[var(--color-bg-card)] rounded border border-[var(--color-border)]"
          >
            <div className="flex justify-between text-[var(--color-text-dim)]">
              <span className="text-[var(--color-accent)]">{log.type}</span>
              <span>{log.durationMs}ms</span>
            </div>
            <div className="mt-1">
              <span className="text-[var(--color-text-dim)]">Villager: </span>
              {log.villagerId}
            </div>
            <details className="mt-1">
              <summary className="cursor-pointer text-[var(--color-text-dim)]">Prompt</summary>
              <pre className="mt-1 whitespace-pre-wrap text-[10px] text-[var(--color-text-dim)]">
                {log.prompt.slice(0, 500)}
              </pre>
            </details>
            <details className="mt-1">
              <summary className="cursor-pointer text-[var(--color-text-dim)]">Response</summary>
              <pre className="mt-1 whitespace-pre-wrap text-[10px]">
                {log.response.slice(0, 500)}
              </pre>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
