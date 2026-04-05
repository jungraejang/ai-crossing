import type { EventBus } from './eventBus';
import type { Clock } from './clock';
import type { AIOrchestrator } from '../ai/orchestrator';

export class SimulationEngine {
  private eventBus: EventBus;
  private clock: Clock;
  private aiOrchestrator: AIOrchestrator;
  private running = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(eventBus: EventBus, clock: Clock, aiOrchestrator: AIOrchestrator) {
    this.eventBus = eventBus;
    this.clock = clock;
    this.aiOrchestrator = aiOrchestrator;
  }

  start(tickIntervalMs: number = 1000) {
    if (this.running) return;
    this.running = true;

    this.intervalId = setInterval(() => {
      this.tick();
    }, tickIntervalMs);

    console.log(`[Engine] Started with ${tickIntervalMs}ms tick interval`);
  }

  stop() {
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('[Engine] Stopped');
  }

  private tick() {
    const dt = 1;
    this.clock.advance(dt);

    this.eventBus.emit({
      type: 'TIME_TICK',
      gameTime: this.clock.getTime(),
    });

    this.eventBus.flush();
  }
}
