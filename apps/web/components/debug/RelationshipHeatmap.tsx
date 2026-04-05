'use client';

import { useGameStore } from '@/stores/gameStore';

export function RelationshipHeatmap() {
  const villagers = useGameStore((s) => s.villagers);
  const names = villagers.map((v) => v.profile.name);

  return (
    <div className="p-3 space-y-2">
      <h4 className="text-xs font-bold text-[var(--color-text-dim)] uppercase">
        Relationship Heatmap
      </h4>
      <div className="overflow-x-auto">
        <table className="text-xs">
          <thead>
            <tr>
              <th className="p-1"></th>
              {names.map((n) => (
                <th key={n} className="p-1 text-center" style={{ writingMode: 'vertical-rl' }}>
                  {n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {villagers.map((v) => (
              <tr key={v.profile.id}>
                <td className="p-1 font-bold text-[var(--color-accent)]">{v.profile.name}</td>
                {villagers.map((other) => {
                  if (v.profile.id === other.profile.id) {
                    return <td key={other.profile.id} className="p-1 text-center text-[var(--color-text-dim)]">-</td>;
                  }
                  const score = v.state.relationshipMap[other.profile.id] ?? 0;
                  const color = score > 0 ? `rgba(74,222,128,${Math.abs(score)/100})` :
                                score < 0 ? `rgba(239,68,68,${Math.abs(score)/100})` :
                                'transparent';
                  return (
                    <td
                      key={other.profile.id}
                      className="p-1 text-center"
                      style={{ backgroundColor: color }}
                    >
                      {score}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
