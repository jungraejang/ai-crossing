export interface GameTime {
  day: number;
  hour: number;
  minute: number;
  /** Fractional minute accumulator for sub-minute tick precision */
  minuteFrac?: number;
}

export interface WorldState {
  time: GameTime;
  weather: Weather;
  season: Season;
  locations: GameLocation[];
  speed: SimulationSpeed;
  isPaused: boolean;
}

export type Weather = 'clear' | 'cloudy' | 'rain' | 'storm';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type SimulationSpeed = 1 | 4 | 16;

export interface GameLocation {
  id: string;
  type: LocationType;
  name: string;
  areaTag: string;
  x: number;
  y: number;
  width: number;
  height: number;
  openHour?: number;
  closeHour?: number;
  metadata?: Record<string, unknown>;
}

export type LocationType =
  | 'home'
  | 'cafe'
  | 'store'
  | 'garden'
  | 'lake'
  | 'workshop'
  | 'town_square'
  | 'path'
  | 'bridge';

export interface TileMapData {
  width: number;
  height: number;
  tileSize: number;
  projection?: MapProjection;
  tileScreenWidth?: number;
  tileScreenHeight?: number;
  layers: TileLayer[];
  locations: GameLocation[];
}

export interface TileLayer {
  name: string;
  data: number[];
  width: number;
  height: number;
  visible: boolean;
}

export type MapProjection = 'orthogonal' | 'isometric';

export type TimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';

export function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export interface WorldDelta {
  timeChanged?: boolean;
  weatherChanged?: Weather;
  locationUpdates?: Array<{ id: string; changes: Partial<GameLocation> }>;
}
