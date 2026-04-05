import type { WorkingMemoryContext, Memory, Villager } from '@ai-crossing/shared';
import type { StructuredMemoryStore } from './structured';
import type { EpisodicMemoryStore } from './episodic';

export class WorkingMemoryBuilder {
  private structuredStore: StructuredMemoryStore;
  private episodicStore: EpisodicMemoryStore;

  constructor(structured: StructuredMemoryStore, episodic: EpisodicMemoryStore) {
    this.structuredStore = structured;
    this.episodicStore = episodic;
  }

  build(
    villager: Villager,
    nearbyActorIds: string[],
    recentDialogue: Array<{ speaker: string; text: string }>,
    currentScene: string,
  ): WorkingMemoryContext {
    const villagerId = villager.profile.id;

    const structuredFacts = this.structuredStore.getTopFacts(villagerId, 5);
    const recentEpisodic = this.episodicStore.getRecentSummaries(villagerId, 5);

    const relevantMemories: Memory[] = [
      ...this.structuredStore.getAll(villagerId).slice(-3),
      ...this.episodicStore.getRecent(villagerId, 3),
    ];

    for (const actorId of nearbyActorIds) {
      const aboutActor = this.structuredStore.query(villagerId, undefined, actorId);
      if (aboutActor.length > 0) {
        relevantMemories.push(aboutActor[0]!);
      }
    }

    return {
      currentScene: `${currentScene}\nKnown facts: ${structuredFacts.join('; ')}\nRecent: ${recentEpisodic.join('; ')}`,
      recentDialogue: recentDialogue.slice(-5),
      immediateObjective: villager.state.shortTermGoals[0] ?? null,
      nearbyActors: nearbyActorIds,
      relevantMemories,
    };
  }
}
