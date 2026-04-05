import type { GameTime, Villager } from '@ai-crossing/shared';
import type { AIOrchestrator } from './orchestrator';
import { createAIJob } from './jobs';

export class AIScheduler {
  private orchestrator: AIOrchestrator;
  private lastDailyPlanDay: Map<string, number> = new Map();
  private lastMemorySumDay: Map<string, number> = new Map();

  constructor(orchestrator: AIOrchestrator) {
    this.orchestrator = orchestrator;
  }

  evaluate(villager: Villager, gameTime: GameTime): void {
    if (gameTime.hour === 6 && gameTime.minute < 5) {
      this.scheduleDailyPlan(villager, gameTime);
    }

    if (gameTime.hour === 23 && gameTime.minute >= 55) {
      this.scheduleMemorySummary(villager, gameTime);
    }
  }

  private scheduleDailyPlan(villager: Villager, gameTime: GameTime): void {
    const lastDay = this.lastDailyPlanDay.get(villager.profile.id);
    if (lastDay === gameTime.day) return;

    this.lastDailyPlanDay.set(villager.profile.id, gameTime.day);

    const job = createAIJob(
      'daily_plan',
      villager.profile.id,
      {
        villagerName: villager.profile.name,
        personality: villager.profile.traits.join(', '),
        currentGoals: villager.state.shortTermGoals,
        relationships: villager.state.relationshipMap,
        yesterdayMemories: [],
        weather: 'clear',
        availableLocations: ['Town Square', 'Café', 'Store', 'Garden', 'Lake', 'Workshop'],
      },
      3,
    );

    this.orchestrator.enqueue(job);
  }

  private scheduleMemorySummary(villager: Villager, gameTime: GameTime): void {
    const lastDay = this.lastMemorySumDay.get(villager.profile.id);
    if (lastDay === gameTime.day) return;

    this.lastMemorySumDay.set(villager.profile.id, gameTime.day);

    const job = createAIJob(
      'memory_summary',
      villager.profile.id,
      {
        villagerName: villager.profile.name,
        memories: [],
        personality: villager.profile.traits.join(', '),
      },
      2,
    );

    this.orchestrator.enqueue(job);
  }
}
