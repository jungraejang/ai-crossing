export type MemoryType = 'structured' | 'episodic' | 'working';

export interface Memory {
  id: string;
  villagerId: string;
  type: MemoryType;
  importance: number;
  summary: string;
  relatedActorIds: string[];
  tags: string[];
  timestamp: number;
  gameDay: number;
  metadata?: Record<string, unknown>;
}

export interface StructuredMemory extends Memory {
  type: 'structured';
  fact: string;
  source: 'observation' | 'told' | 'inferred';
  confidence: number;
}

export interface EpisodicMemory extends Memory {
  type: 'episodic';
  emotionalTone: string;
  location: string;
}

export interface WorkingMemoryContext {
  currentScene: string;
  recentDialogue: Array<{ speaker: string; text: string }>;
  immediateObjective: string | null;
  nearbyActors: string[];
  relevantMemories: Memory[];
}
