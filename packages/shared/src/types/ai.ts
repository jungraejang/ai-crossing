export interface DialogueInput {
  villagerName: string;
  villagerProfile: string;
  personality: string;
  speakingStyle: string;
  currentMood: string;
  currentLocation: string;
  memories: string[];
  relationshipWithSpeaker: number;
  speakerName: string;
  message: string;
  sceneContext: string;
}

export interface DialogueResult {
  dialogue: string;
  moodChange: string | null;
  shouldRemember: boolean;
  emotionalReaction?: string;
  relationshipDelta?: number;
}

export interface VillagerDialogueInput {
  villagerA: { name: string; profile: string; mood: string };
  villagerB: { name: string; profile: string; mood: string };
  relationship: number;
  sharedMemories: string[];
  location: string;
  context: string;
}

export interface VillagerDialogueResult {
  exchanges: Array<{ speaker: string; text: string }>;
  relationshipDelta: number;
  memoriesForA: string[];
  memoriesForB: string[];
}

export interface ReactionInput {
  villagerName: string;
  personality: string;
  currentMood: string;
  event: string;
  context: string;
}

export interface ReactionResult {
  reaction: string;
  moodChange: string;
  shouldRemember: boolean;
  newGoal?: string;
}

export interface PlanInput {
  villagerName: string;
  personality: string;
  currentGoals: string[];
  relationships: Record<string, number>;
  yesterdayMemories: string[];
  weather: string;
  availableLocations: string[];
}

export interface PlanResult {
  intentions: string[];
  priority: string;
  avoidances: string[];
}

export interface MemorySumInput {
  villagerName: string;
  memories: string[];
  personality: string;
}

export interface MemorySumResult {
  summaries: Array<{
    summary: string;
    importance: number;
    tags: string[];
  }>;
}

export interface AgentThinkInput {
  villager: {
    name: string;
    job: string;
    traits: string[];
    speakingStyle: string;
    mood: string;
    needs: { hunger: number; energy: number; stress: number; boredom: number; sociability: number };
  };
  perception: {
    nearbyActors: Array<{ name: string; job: string; mood: string; action: string; relationship: number }>;
    currentLocation: string;
    timeOfDay: string;
    weather: string;
    recentEvents: string[];
  };
  memories: {
    facts: string[];
    recentEpisodes: string[];
  };
  currentPlan: string[];
  availableActions: string[];
  context: string;
  conversationHistory?: Array<{ speaker: string; text: string }>;
}

export interface AgentThinkResult {
  thought: string;
  action: string;
  target?: string;
  speech?: string;
  shouldRemember?: boolean;
  memoryNote?: string;
}

export type AIJobType =
  | 'player_dialogue'
  | 'villager_dialogue'
  | 'reaction'
  | 'daily_plan'
  | 'memory_summary';

export interface AIJob {
  id: string;
  type: AIJobType;
  villagerId: string;
  input: unknown;
  priority: number;
  createdAt: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
}
