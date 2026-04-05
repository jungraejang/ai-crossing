import type { GameLocation } from '@ai-crossing/shared';
import { DEFAULT_LOCATIONS } from './map';

export class LocationManager {
  private locations: Map<string, GameLocation> = new Map();

  constructor() {
    for (const loc of DEFAULT_LOCATIONS) {
      this.locations.set(loc.id, loc);
    }
  }

  getLocation(id: string): GameLocation | undefined {
    return this.locations.get(id);
  }

  getLocationByTag(tag: string): GameLocation | undefined {
    for (const loc of this.locations.values()) {
      if (loc.areaTag === tag) return loc;
    }
    return undefined;
  }

  getAllLocations(): GameLocation[] {
    return Array.from(this.locations.values());
  }

  getLocationAt(x: number, y: number): GameLocation | undefined {
    for (const loc of this.locations.values()) {
      if (
        x >= loc.x &&
        x < loc.x + loc.width &&
        y >= loc.y &&
        y < loc.y + loc.height
      ) {
        return loc;
      }
    }
    return undefined;
  }
}
