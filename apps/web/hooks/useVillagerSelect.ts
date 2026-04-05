import { useCallback } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useGameStore } from '@/stores/gameStore';

export function useVillagerSelect() {
  const selectVillager = useUIStore((s) => s.selectVillager);
  const villagers = useGameStore((s) => s.villagers);

  const handleTileClick = useCallback(
    (tileX: number, tileY: number) => {
      const clicked = villagers.find((v) => {
        const dx = Math.abs(v.state.x - tileX);
        const dy = Math.abs(v.state.y - tileY);
        return dx < 1 && dy < 1;
      });

      selectVillager(clicked?.profile.id ?? null);
    },
    [villagers, selectVillager],
  );

  return { handleTileClick };
}
