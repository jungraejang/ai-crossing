import type { EpisodicMemory } from '@ai-crossing/shared';

export class EpisodicMemoryStore {
  private memories: Map<string, EpisodicMemory[]> = new Map();
  private maxPerVillager: number;

  constructor(maxPerVillager: number = 100) {
    this.maxPerVillager = maxPerVillager;
  }

  add(memory: EpisodicMemory): void {
    const existing = this.memories.get(memory.villagerId) ?? [];
    existing.push(memory);
    if (existing.length > this.maxPerVillager) {
      existing.sort((a, b) => b.importance - a.importance);
      existing.length = this.maxPerVillager;
    }
    this.memories.set(memory.villagerId, existing);
  }

  getRecent(villagerId: string, limit: number = 10): EpisodicMemory[] {
    const all = this.memories.get(villagerId) ?? [];
    return [...all].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  getByDay(villagerId: string, day: number): EpisodicMemory[] {
    const all = this.memories.get(villagerId) ?? [];
    return all.filter((m) => m.gameDay === day);
  }

  getTopByImportance(villagerId: string, limit: number = 5): EpisodicMemory[] {
    const all = this.memories.get(villagerId) ?? [];
    return [...all].sort((a, b) => b.importance - a.importance).slice(0, limit);
  }

  getRecentSummaries(villagerId: string, limit: number = 5): string[] {
    return this.getRecent(villagerId, limit).map((m) => m.summary);
  }

  replaceDay(villagerId: string, day: number, summaries: EpisodicMemory[]): void {
    const existing = this.memories.get(villagerId) ?? [];
    const filtered = existing.filter((m) => m.gameDay !== day);
    filtered.push(...summaries);
    this.memories.set(villagerId, filtered);
  }

  getAll(villagerId: string): EpisodicMemory[] {
    return this.memories.get(villagerId) ?? [];
  }

  serialize(): Record<string, EpisodicMemory[]> {
    const out: Record<string, EpisodicMemory[]> = {};
    for (const [k, v] of this.memories) {
      out[k] = v;
    }
    return out;
  }

  load(data: Record<string, EpisodicMemory[]>): void {
    this.memories.clear();
    for (const [k, v] of Object.entries(data)) {
      this.memories.set(k, v);
    }
  }
}
