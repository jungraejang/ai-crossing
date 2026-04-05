import type {
  DialogueInput,
  DialogueResult,
  ReactionInput,
  ReactionResult,
  PlanInput,
  PlanResult,
  MemorySumInput,
  MemorySumResult,
  VillagerDialogueInput,
  VillagerDialogueResult,
  AgentThinkInput,
  AgentThinkResult,
} from '@ai-crossing/shared';

export interface LLMProvider {
  generateDialogue(input: DialogueInput): Promise<DialogueResult>;
  generateVillagerDialogue(input: VillagerDialogueInput): Promise<VillagerDialogueResult>;
  generateReaction(input: ReactionInput): Promise<ReactionResult>;
  generatePlan(input: PlanInput): Promise<PlanResult>;
  summarizeMemory(input: MemorySumInput): Promise<MemorySumResult>;
  agentThink(input: AgentThinkInput): Promise<AgentThinkResult>;
}

export interface LLMProviderConfig {
  baseUrl: string;
  model: string;
  apiKey?: string;
  maxRetries?: number;
  timeoutMs?: number;
}
