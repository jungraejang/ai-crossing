import type { Villager } from '@ai-crossing/shared';
import type { EventBus } from '../simulation/eventBus';
import { getRelationship } from './relationships';

export class ConflictDetector {
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  checkForConflicts(villagers: Villager[]): void {
    for (let i = 0; i < villagers.length; i++) {
      for (let j = i + 1; j < villagers.length; j++) {
        const a = villagers[i]!;
        const b = villagers[j]!;

        if (a.state.currentLocation !== b.state.currentLocation) continue;

        const relAB = getRelationship(a, b.profile.id);
        const relBA = getRelationship(b, a.profile.id);

        if (relAB < -50 || relBA < -50) {
          const bothPresent =
            a.state.currentAction?.type !== 'sleeping' &&
            b.state.currentAction?.type !== 'sleeping';

          if (bothPresent && Math.random() < 0.1) {
            this.eventBus.emit({
              type: 'CONFLICT_TRIGGER',
              participants: [a.profile.id, b.profile.id],
              cause: 'hostile_encounter',
              timestamp: Date.now(),
            });
          }
        }
      }
    }
  }
}
