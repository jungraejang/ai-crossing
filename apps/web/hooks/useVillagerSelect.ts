import { useCallback } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useGameStore } from '@/stores/gameStore';
import { pickVillagerAtScreenPoint } from '@/lib/villagerPicking';
import { DEFAULT_ISO_CONFIG } from '@/lib/isometric';

export function useVillagerSelect() {
  const selectVillager = useUIStore((s) => s.selectVillager);
  const villagers = useGameStore((s) => s.villagers);

  const handleTileClick = useCallback(
    (screenX: number, screenY: number) => {
      const clicked = pickVillagerAtScreenPoint(villagers, screenX, screenY, DEFAULT_ISO_CONFIG);
      selectVillager(clicked?.profile.id ?? null);
    },
    [villagers, selectVillager],
  );

  return { handleTileClick };
}
