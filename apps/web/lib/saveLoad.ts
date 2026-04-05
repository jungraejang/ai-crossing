import type { Villager, WorldState, GameEventLog } from '@ai-crossing/shared';
import { useGameStore } from '@/stores/gameStore';

export interface SaveData {
  version: number;
  savedAt: string;
  name: string;
  world: WorldState;
  villagers: Villager[];
  eventLog: GameEventLog[];
}

const SAVE_VERSION = 1;
const STORAGE_PREFIX = 'ai-crossing-save-';

export function saveGame(slotName: string): SaveData {
  const store = useGameStore.getState();

  const data: SaveData = {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    name: slotName,
    world: store.world,
    villagers: store.villagers,
    eventLog: store.eventLog.slice(-100),
  };

  localStorage.setItem(`${STORAGE_PREFIX}${slotName}`, JSON.stringify(data));
  return data;
}

export function loadGame(slotName: string): boolean {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${slotName}`);
  if (!raw) return false;

  try {
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== SAVE_VERSION) {
      console.warn(`Save version mismatch: expected ${SAVE_VERSION}, got ${data.version}`);
    }

    const store = useGameStore.getState();
    store.initialize(data.world, data.villagers);

    for (const event of data.eventLog) {
      store.pushEvent(event);
    }

    return true;
  } catch (err) {
    console.error('Failed to load save:', err);
    return false;
  }
}

export function listSaves(): Array<{ name: string; savedAt: string }> {
  const saves: Array<{ name: string; savedAt: string }> = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(STORAGE_PREFIX)) continue;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const data = JSON.parse(raw) as SaveData;
      saves.push({ name: data.name, savedAt: data.savedAt });
    } catch {
      // skip corrupt saves
    }
  }

  return saves.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

export function deleteSave(slotName: string): void {
  localStorage.removeItem(`${STORAGE_PREFIX}${slotName}`);
}

export function exportSave(slotName: string): string | null {
  return localStorage.getItem(`${STORAGE_PREFIX}${slotName}`);
}

export function importSave(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString) as SaveData;
    if (!data.name || !data.world || !data.villagers) {
      throw new Error('Invalid save data');
    }
    localStorage.setItem(`${STORAGE_PREFIX}${data.name}`, jsonString);
    return true;
  } catch {
    return false;
  }
}
