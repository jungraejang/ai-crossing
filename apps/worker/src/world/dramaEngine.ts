import type { Villager, GameTime } from '@ai-crossing/shared';
import type { EventBus } from '../simulation/eventBus';

export interface DramaEvent {
  id: string;
  type: DramaType;
  title: string;
  description: string;
  affectedLocationIds: string[];
  affectedVillagerIds: string[];
  duration: number;
  startTime: number;
}

export type DramaType =
  | 'storm'
  | 'broken_bridge'
  | 'lost_item'
  | 'festival'
  | 'mysterious_visitor'
  | 'crop_blight'
  | 'workshop_fire';

const DRAMA_TEMPLATES: Array<{
  type: DramaType;
  title: string;
  description: string;
  probability: number;
  locations: string[];
  durationMinutes: number;
}> = [
  {
    type: 'storm',
    title: 'A sudden storm!',
    description: 'Dark clouds gather and rain pours. Villagers scramble for shelter.',
    probability: 0.08,
    locations: ['lake', 'garden', 'town_square'],
    durationMinutes: 120,
  },
  {
    type: 'broken_bridge',
    title: 'The bridge is broken!',
    description: 'The old bridge over the lake has partially collapsed. It needs repair.',
    probability: 0.03,
    locations: ['bridge', 'lake'],
    durationMinutes: 480,
  },
  {
    type: 'lost_item',
    title: 'Something lost',
    description: 'A villager has lost something precious and is looking everywhere.',
    probability: 0.1,
    locations: ['town_square', 'cafe', 'store'],
    durationMinutes: 240,
  },
  {
    type: 'festival',
    title: 'Village Festival!',
    description: 'The village is celebrating! Everyone gathers at the town square.',
    probability: 0.05,
    locations: ['town_square', 'cafe'],
    durationMinutes: 360,
  },
  {
    type: 'mysterious_visitor',
    title: 'A stranger arrives',
    description: 'A mysterious figure has been spotted near the village entrance.',
    probability: 0.04,
    locations: ['town_square'],
    durationMinutes: 180,
  },
  {
    type: 'crop_blight',
    title: 'Crop troubles',
    description: 'Strange spots appear on the garden crops. The herbalist might know what to do.',
    probability: 0.06,
    locations: ['garden'],
    durationMinutes: 480,
  },
  {
    type: 'workshop_fire',
    title: 'Smoke from the workshop!',
    description: 'A small fire breaks out in the workshop. Villagers rush to help.',
    probability: 0.03,
    locations: ['workshop'],
    durationMinutes: 120,
  },
];

export class DramaEngine {
  private eventBus: EventBus;
  private activeEvents: Map<string, DramaEvent> = new Map();
  private lastCheckDay = 0;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  checkForDrama(gameTime: GameTime, villagers: Villager[]): DramaEvent | null {
    if (gameTime.day === this.lastCheckDay) return null;
    if (gameTime.hour !== 8) return null;

    this.lastCheckDay = gameTime.day;
    this.cleanupExpired();

    if (this.activeEvents.size >= 2) return null;

    for (const template of DRAMA_TEMPLATES) {
      if (Math.random() < template.probability) {
        const event = this.createDramaEvent(template, villagers);
        this.activeEvents.set(event.id, event);

        this.eventBus.emit({
          type: 'WORLD_STATE_CHANGED',
          changes: { timeChanged: false },
          timestamp: Date.now(),
        });

        return event;
      }
    }

    return null;
  }

  private createDramaEvent(
    template: (typeof DRAMA_TEMPLATES)[number],
    villagers: Villager[],
  ): DramaEvent {
    const affected = villagers
      .filter((v) => template.locations.includes(v.state.currentLocation))
      .map((v) => v.profile.id);

    return {
      id: `drama_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: template.type,
      title: template.title,
      description: template.description,
      affectedLocationIds: template.locations,
      affectedVillagerIds: affected.length > 0 ? affected : villagers.slice(0, 3).map((v) => v.profile.id),
      duration: template.durationMinutes * 60000,
      startTime: Date.now(),
    };
  }

  getActiveEvents(): DramaEvent[] {
    return Array.from(this.activeEvents.values());
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [id, event] of this.activeEvents) {
      if (now - event.startTime > event.duration) {
        this.activeEvents.delete(id);
      }
    }
  }
}
