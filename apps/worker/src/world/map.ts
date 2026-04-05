import type { TileMapData, GameLocation } from '@ai-crossing/shared';
import { AREA_TAGS } from '@ai-crossing/shared';

export const DEFAULT_LOCATIONS: GameLocation[] = [
  { id: 'town_square', type: 'town_square', name: 'Town Square', areaTag: AREA_TAGS.TOWN_SQUARE, x: 20, y: 14, width: 6, height: 4 },
  { id: 'cafe', type: 'cafe', name: 'Café', areaTag: AREA_TAGS.CAFE, x: 15, y: 20, width: 4, height: 3, openHour: 6, closeHour: 22 },
  { id: 'store', type: 'store', name: 'General Store', areaTag: AREA_TAGS.STORE, x: 28, y: 14, width: 4, height: 3, openHour: 8, closeHour: 20 },
  { id: 'garden', type: 'garden', name: 'Garden', areaTag: AREA_TAGS.GARDEN, x: 8, y: 14, width: 4, height: 3 },
  { id: 'lake', type: 'lake', name: 'Lake', areaTag: AREA_TAGS.LAKE, x: 20, y: 26, width: 10, height: 3 },
  { id: 'workshop', type: 'workshop', name: 'Workshop', areaTag: AREA_TAGS.WORKSHOP, x: 28, y: 5, width: 4, height: 3, openHour: 7, closeHour: 18 },
  { id: 'home_1', type: 'home', name: 'Home 1', areaTag: AREA_TAGS.HOME_1, x: 6, y: 5, width: 4, height: 3 },
  { id: 'home_2', type: 'home', name: 'Home 2', areaTag: AREA_TAGS.HOME_2, x: 14, y: 5, width: 4, height: 3 },
  { id: 'home_3', type: 'home', name: 'Home 3', areaTag: AREA_TAGS.HOME_3, x: 6, y: 20, width: 4, height: 3 },
  { id: 'home_4', type: 'home', name: 'Home 4', areaTag: AREA_TAGS.HOME_4, x: 24, y: 20, width: 4, height: 3 },
  { id: 'home_5', type: 'home', name: 'Home 5', areaTag: AREA_TAGS.HOME_5, x: 32, y: 20, width: 4, height: 3 },
];

export function isLocationOpen(location: GameLocation, hour: number): boolean {
  if (location.openHour === undefined || location.closeHour === undefined) return true;
  return hour >= location.openHour && hour < location.closeHour;
}
