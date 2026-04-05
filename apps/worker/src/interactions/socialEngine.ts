import type { Villager } from '@ai-crossing/shared';
import type { InteractionType } from '@ai-crossing/shared';
import { INTERACTION_RELATIONSHIP_DELTAS, SOCIAL_AREAS } from '@ai-crossing/shared';
import type { EventBus } from '../simulation/eventBus';

export class SocialEngine {
  private eventBus: EventBus;
  private recentEncounters: Map<string, number> = new Map();
  private encounterCooldownMs = 60000;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  checkEncounters(villagers: Villager[]): void {
    const now = Date.now();

    for (let i = 0; i < villagers.length; i++) {
      for (let j = i + 1; j < villagers.length; j++) {
        const a = villagers[i]!;
        const b = villagers[j]!;

        if (a.state.currentLocation !== b.state.currentLocation) continue;

        const dx = a.state.x - b.state.x;
        const dy = a.state.y - b.state.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 3) continue;

        const pairKey = [a.profile.id, b.profile.id].sort().join(':');
        const lastEncounter = this.recentEncounters.get(pairKey);
        if (lastEncounter && now - lastEncounter < this.encounterCooldownMs) continue;

        this.recentEncounters.set(pairKey, now);

        this.eventBus.emit({
          type: 'SEE_CHARACTER',
          villagerId: a.profile.id,
          seenId: b.profile.id,
          area: a.state.currentLocation,
          timestamp: now,
        });

        const shouldInteract = this.shouldTriggerInteraction(a, b);
        if (shouldInteract) {
          this.eventBus.emit({
            type: 'SOCIAL_INVITE',
            fromId: a.profile.id,
            toId: b.profile.id,
            timestamp: now,
          });
        }
      }
    }
  }

  private shouldTriggerInteraction(a: Villager, b: Villager): boolean {
    const avgSociability = (a.state.sociability + b.state.sociability) / 2;
    const relationship = a.state.relationshipMap[b.profile.id] ?? 0;
    const inSocialArea = SOCIAL_AREAS.includes(a.state.currentLocation as (typeof SOCIAL_AREAS)[number]);

    let probability = avgSociability / 200;
    if (relationship > 20) probability += 0.15;
    if (relationship < -20) probability -= 0.15;
    if (inSocialArea) probability += 0.1;

    return Math.random() < probability;
  }

  resolveInteraction(
    a: Villager,
    b: Villager,
  ): { type: InteractionType; deltaA: number; deltaB: number } {
    const relationship = a.state.relationshipMap[b.profile.id] ?? 0;
    let type: InteractionType;

    if (relationship < -30) {
      type = Math.random() < 0.3 ? 'argue' : 'ignore';
    } else if (relationship > 30) {
      type = Math.random() < 0.7 ? 'small_talk' : 'help';
    } else {
      const roll = Math.random();
      if (roll < 0.4) type = 'greet';
      else if (roll < 0.7) type = 'small_talk';
      else if (roll < 0.85) type = 'help';
      else type = 'ignore';
    }

    const delta = INTERACTION_RELATIONSHIP_DELTAS[type];
    return { type, deltaA: delta, deltaB: delta };
  }
}
