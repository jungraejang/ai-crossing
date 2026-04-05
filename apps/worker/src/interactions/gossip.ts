import type { Villager, StructuredMemory } from '@ai-crossing/shared';
import type { EventBus } from '../simulation/eventBus';
import { getRelationship } from './relationships';

export class GossipSystem {
  private eventBus: EventBus;
  private recentGossipPairs: Map<string, number> = new Map();
  private gossipCooldownMs = 300000;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  tryGossip(
    speaker: Villager,
    listener: Villager,
    allVillagers: Villager[],
    memories: StructuredMemory[],
  ): GossipResult | null {
    const pairKey = [speaker.profile.id, listener.profile.id].sort().join(':gossip:');
    const lastGossip = this.recentGossipPairs.get(pairKey);
    if (lastGossip && Date.now() - lastGossip < this.gossipCooldownMs) return null;

    if (!speaker.profile.traits.includes('gossip-prone') && !speaker.profile.traits.includes('talkative')) {
      if (Math.random() > 0.2) return null;
    }

    const thirdParties = allVillagers.filter(
      (v) => v.profile.id !== speaker.profile.id && v.profile.id !== listener.profile.id,
    );
    if (thirdParties.length === 0) return null;

    const target = thirdParties[Math.floor(Math.random() * thirdParties.length)]!;
    const relevantMemories = memories.filter(
      (m) =>
        m.villagerId === speaker.profile.id && m.relatedActorIds.includes(target.profile.id),
    );

    if (relevantMemories.length === 0) return null;

    const memory = relevantMemories[Math.floor(Math.random() * relevantMemories.length)]!;

    this.recentGossipPairs.set(pairKey, Date.now());

    this.eventBus.emit({
      type: 'MEMORY_CREATED',
      villagerId: listener.profile.id,
      memory: {
        id: `gossip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        villagerId: listener.profile.id,
        type: 'structured',
        importance: memory.importance * 0.7,
        summary: `Heard from ${speaker.profile.name}: ${memory.fact}`,
        relatedActorIds: [speaker.profile.id, target.profile.id],
        tags: ['gossip', ...memory.tags],
        timestamp: Date.now(),
        gameDay: 0,
      },
      timestamp: Date.now(),
    });

    return {
      speaker: speaker.profile.id,
      listener: listener.profile.id,
      subject: target.profile.id,
      content: memory.fact,
      listenerRelDelta: computeGossipRelationshipDelta(memory, listener, target),
    };
  }
}

function computeGossipRelationshipDelta(
  memory: StructuredMemory,
  listener: Villager,
  subject: Villager,
): number {
  const isNegativeGossip = memory.tags.includes('conflict') || memory.tags.includes('negative');
  const isPositiveGossip = memory.tags.includes('positive') || memory.tags.includes('helpful');

  if (isNegativeGossip) return -2;
  if (isPositiveGossip) return 1;
  return 0;
}

export interface GossipResult {
  speaker: string;
  listener: string;
  subject: string;
  content: string;
  listenerRelDelta: number;
}
