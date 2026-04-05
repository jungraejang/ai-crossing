import { SimulationEngine } from './simulation/engine';
import { EventBus } from './simulation/eventBus';
import { Clock } from './simulation/clock';
import { AIOrchestrator } from './ai/orchestrator';

async function main() {
  console.log('[Worker] AI Crossing simulation worker starting...');

  const eventBus = new EventBus();
  const clock = new Clock();
  const aiOrchestrator = new AIOrchestrator(eventBus);
  const engine = new SimulationEngine(eventBus, clock, aiOrchestrator);

  eventBus.on('*', (event) => {
    if (event.type !== 'TIME_TICK') {
      console.log(`[Event] ${event.type}`, JSON.stringify(event).slice(0, 120));
    }
  });

  process.on('SIGINT', () => {
    console.log('[Worker] Shutting down...');
    engine.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('[Worker] Shutting down...');
    engine.stop();
    process.exit(0);
  });

  console.log('[Worker] Simulation worker ready. Waiting for commands via Redis pub/sub...');
  console.log('[Worker] (In MVP, the simulation runs client-side. This worker handles AI jobs.)');

  await aiOrchestrator.start();
}

main().catch((err) => {
  console.error('[Worker] Fatal error:', err);
  process.exit(1);
});
