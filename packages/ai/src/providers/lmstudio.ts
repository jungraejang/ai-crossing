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
import {
  dialogueResultSchema,
  reactionResultSchema,
  planResultSchema,
  memorySumResultSchema,
  villagerDialogueResultSchema,
  agentThinkResultSchema,
} from '@ai-crossing/shared';
import type { LLMProvider, LLMProviderConfig } from './base';
import { buildDialoguePrompt, buildVillagerDialoguePrompt } from '../prompts/dialogue';
import { buildReactionPrompt } from '../prompts/reaction';
import { buildPlanPrompt } from '../prompts/plan';
import { buildMemoryPrompt } from '../prompts/memory';
import { buildAgentThinkPrompt } from '../prompts/agentThink';

export class LMStudioProvider implements LLMProvider {
  private baseUrl: string;
  private model: string;
  private maxRetries: number;
  private timeoutMs: number;

  constructor(config: LLMProviderConfig) {
    this.baseUrl = config.baseUrl || 'http://127.0.0.1:1234';
    this.model = config.model || 'default';
    this.maxRetries = config.maxRetries ?? 3;
    this.timeoutMs = config.timeoutMs ?? 30000;
  }

  private async chat(systemPrompt: string, userPrompt: string): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: 'system', content: `${systemPrompt}\n\nIMPORTANT: Respond with ONLY valid JSON. No markdown, no explanation.` },
              { role: 'user', content: `${userPrompt}\n\nRespond with ONLY the JSON object.` },
            ],
            temperature: 0.7,
            max_tokens: 1024,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`LM Studio API error: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>;
        };

        let raw = data.choices?.[0]?.message?.content ?? '';
        if (!raw || raw.trim().length < 5) {
          const reasoning = data.choices?.[0]?.message?.reasoning_content;
          if (reasoning) {
            const reasoningJson = reasoning.match(/\{[\s\S]*\}/);
            if (reasoningJson) raw = reasoningJson[0];
          }
        }

        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) raw = jsonMatch[0];
        return raw;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < this.maxRetries - 1) {
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError ?? new Error('LM Studio request failed');
  }

  private parseJSON<T>(raw: string, schema: { parse: (data: unknown) => T }): T {
    const parsed: unknown = JSON.parse(raw);
    return schema.parse(parsed);
  }

  async generateDialogue(input: DialogueInput): Promise<DialogueResult> {
    const { system, user } = buildDialoguePrompt(input);
    const raw = await this.chat(system, user);
    return this.parseJSON(raw, dialogueResultSchema);
  }

  async generateVillagerDialogue(input: VillagerDialogueInput): Promise<VillagerDialogueResult> {
    const { system, user } = buildVillagerDialoguePrompt(input);
    const raw = await this.chat(system, user);
    return this.parseJSON(raw, villagerDialogueResultSchema);
  }

  async generateReaction(input: ReactionInput): Promise<ReactionResult> {
    const { system, user } = buildReactionPrompt(input);
    const raw = await this.chat(system, user);
    return this.parseJSON(raw, reactionResultSchema);
  }

  async generatePlan(input: PlanInput): Promise<PlanResult> {
    const { system, user } = buildPlanPrompt(input);
    const raw = await this.chat(system, user);
    return this.parseJSON(raw, planResultSchema);
  }

  async summarizeMemory(input: MemorySumInput): Promise<MemorySumResult> {
    const { system, user } = buildMemoryPrompt(input);
    const raw = await this.chat(system, user);
    return this.parseJSON(raw, memorySumResultSchema);
  }

  async agentThink(input: AgentThinkInput): Promise<AgentThinkResult> {
    const { system, user } = buildAgentThinkPrompt(input);
    const raw = await this.chat(system, user);
    return this.parseJSON(raw, agentThinkResultSchema);
  }
}
