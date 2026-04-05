import type { StructuredMemory } from '@ai-crossing/shared';

export class StructuredMemoryStore {
  private memories: Map<string, StructuredMemory[]> = new Map();

  add(memory: StructuredMemory): void {
    const existing = this.memories.get(memory.villagerId) ?? [];
    const duplicate = existing.find(
      (m) => m.fact === memory.fact && m.relatedActorIds.join() === memory.relatedActorIds.join(),
    );
    if (duplicate) {
      duplicate.confidence = Math.max(duplicate.confidence, memory.confidence);
      duplicate.timestamp = memory.timestamp;
      return;
    }
    existing.push(memory);
    this.memories.set(memory.villagerId, existing);
  }

  query(villagerId: string, tags?: string[], actorId?: string): StructuredMemory[] {
    const all = this.memories.get(villagerId) ?? [];
    return all.filter((m) => {
      if (tags && tags.length > 0 && !tags.some((t) => m.tags.includes(t))) return false;
      if (actorId && !m.relatedActorIds.includes(actorId)) return false;
      return true;
    });
  }

  getAll(villagerId: string): StructuredMemory[] {
    return this.memories.get(villagerId) ?? [];
  }

  getTopFacts(villagerId: string, limit: number = 10): string[] {
    const all = this.getAll(villagerId);
    return all
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit)
      .map((m) => m.fact);
  }

  clear(villagerId: string): void {
    this.memories.delete(villagerId);
  }

  serialize(): Record<string, StructuredMemory[]> {
    const out: Record<string, StructuredMemory[]> = {};
    for (const [k, v] of this.memories) {
      out[k] = v;
    }
    return out;
  }

  load(data: Record<string, StructuredMemory[]>): void {
    this.memories.clear();
    for (const [k, v] of Object.entries(data)) {
      this.memories.set(k, v);
    }
  }
}
