import type { AIJob } from '@ai-crossing/shared';
import type { EventBus } from '../simulation/eventBus';
import { createProvider } from '@ai-crossing/ai';
import type { LLMProvider } from '@ai-crossing/ai';

export class AIOrchestrator {
  private eventBus: EventBus;
  private queue: AIJob[] = [];
  private processing = false;
  private provider: LLMProvider;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.provider = createProvider(
      (process.env.AI_PROVIDER as 'lmstudio') || 'lmstudio',
      {
        baseUrl: process.env.LMSTUDIO_URL || 'http://127.0.0.1:1234',
        model: process.env.LMSTUDIO_MODEL || 'default',
      },
    );
  }

  enqueue(job: AIJob): void {
    this.queue.push(job);
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  async start(): Promise<void> {
    console.log('[AI Orchestrator] Started. Waiting for AI jobs...');
    this.processing = true;
    this.processLoop();
  }

  stop(): void {
    this.processing = false;
  }

  private async processLoop(): Promise<void> {
    while (this.processing) {
      if (this.queue.length === 0) {
        await sleep(1000);
        continue;
      }

      const job = this.queue.shift()!;
      job.status = 'processing';

      try {
        const startTime = Date.now();
        let result: unknown;

        switch (job.type) {
          case 'player_dialogue':
            result = await this.provider.generateDialogue(job.input as Parameters<LLMProvider['generateDialogue']>[0]);
            break;
          case 'villager_dialogue':
            result = await this.provider.generateVillagerDialogue(job.input as Parameters<LLMProvider['generateVillagerDialogue']>[0]);
            break;
          case 'reaction':
            result = await this.provider.generateReaction(job.input as Parameters<LLMProvider['generateReaction']>[0]);
            break;
          case 'daily_plan':
            result = await this.provider.generatePlan(job.input as Parameters<LLMProvider['generatePlan']>[0]);
            break;
          case 'memory_summary':
            result = await this.provider.summarizeMemory(job.input as Parameters<LLMProvider['summarizeMemory']>[0]);
            break;
        }

        job.status = 'completed';
        job.result = result;

        const elapsed = Date.now() - startTime;
        console.log(`[AI] Job ${job.type} for ${job.villagerId} completed in ${elapsed}ms`);
      } catch (err) {
        job.status = 'failed';
        job.error = err instanceof Error ? err.message : String(err);
        console.error(`[AI] Job ${job.type} failed:`, job.error);
      }
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
