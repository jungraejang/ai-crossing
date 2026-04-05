import type { GameEvent, GameEventLog, GameTime } from '@ai-crossing/shared';

type EventHandler = (event: GameEvent) => void;

export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private queue: GameEvent[] = [];
  private log: GameEventLog[] = [];
  private maxLogSize = 1000;

  on(eventType: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventType) ?? [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
  }

  off(eventType: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventType) ?? [];
    this.handlers.set(
      eventType,
      existing.filter((h) => h !== handler),
    );
  }

  emit(event: GameEvent): void {
    this.queue.push(event);
  }

  flush(): void {
    const events = [...this.queue];
    this.queue = [];

    for (const event of events) {
      const typeHandlers = this.handlers.get(event.type) ?? [];
      const wildcardHandlers = this.handlers.get('*') ?? [];

      for (const handler of [...typeHandlers, ...wildcardHandlers]) {
        try {
          handler(event);
        } catch (err) {
          console.error(`[EventBus] Handler error for ${event.type}:`, err);
        }
      }

      this.log.push({
        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        event,
        gameTime: (event as { gameTime?: GameTime }).gameTime ?? { day: 0, hour: 0, minute: 0 },
        realTimestamp: Date.now(),
      });

      if (this.log.length > this.maxLogSize) {
        this.log = this.log.slice(-this.maxLogSize);
      }
    }
  }

  getRecentLogs(count: number = 50): GameEventLog[] {
    return this.log.slice(-count);
  }

  clearLog(): void {
    this.log = [];
  }
}
