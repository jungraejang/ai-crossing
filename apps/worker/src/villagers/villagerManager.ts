import type { Villager, VillagerState, GameTime } from '@ai-crossing/shared';
import type { EventBus } from '../simulation/eventBus';

export class VillagerManager {
  private villagers: Map<string, Villager> = new Map();
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  addVillager(villager: Villager): void {
    this.villagers.set(villager.profile.id, villager);
  }

  getVillager(id: string): Villager | undefined {
    return this.villagers.get(id);
  }

  getAllVillagers(): Villager[] {
    return Array.from(this.villagers.values());
  }

  updateState(id: string, updates: Partial<VillagerState>): void {
    const villager = this.villagers.get(id);
    if (!villager) return;

    const previousLocation = villager.state.currentLocation;
    villager.state = { ...villager.state, ...updates };

    if (updates.currentLocation && updates.currentLocation !== previousLocation) {
      this.eventBus.emit({
        type: 'ENTER_AREA',
        villagerId: id,
        areaTag: updates.currentLocation,
        timestamp: Date.now(),
      });
    }
  }

  tick(dt: number, gameTime: GameTime): void {
    for (const villager of this.villagers.values()) {
      this.updateNeeds(villager, dt);
    }
  }

  private updateNeeds(villager: Villager, dt: number): void {
    const state = villager.state;
    state.hunger = Math.min(100, state.hunger + 0.15 * dt);
    state.energy = Math.max(0, state.energy - 0.1 * dt);
    state.stress = Math.min(100, state.stress + 0.02 * dt);
    state.boredom = Math.min(100, state.boredom + 0.08 * dt);
    state.sociability = Math.min(100, state.sociability + 0.05 * dt);
  }

  serialize(): Villager[] {
    return this.getAllVillagers();
  }

  load(villagers: Villager[]): void {
    this.villagers.clear();
    for (const v of villagers) {
      this.villagers.set(v.profile.id, v);
    }
  }
}
