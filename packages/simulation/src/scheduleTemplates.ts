import type { ScheduleBlock } from '@ai-crossing/shared';
import { AREA_TAGS } from '@ai-crossing/shared';

export const SCHEDULE_TEMPLATES: Record<string, ScheduleBlock[]> = {
  baker: [
    { startHour: 6, endHour: 7, action: 'eating', locationId: '' },
    { startHour: 7, endHour: 12, action: 'working', locationId: AREA_TAGS.CAFE },
    { startHour: 12, endHour: 13, action: 'eating', locationId: AREA_TAGS.TOWN_SQUARE },
    { startHour: 13, endHour: 17, action: 'working', locationId: AREA_TAGS.CAFE },
    { startHour: 17, endHour: 19, action: 'wandering', locationId: AREA_TAGS.LAKE },
    { startHour: 19, endHour: 21, action: 'resting', locationId: '' },
    { startHour: 21, endHour: 6, action: 'sleeping', locationId: '' },
  ],
  farmer: [
    { startHour: 5, endHour: 6, action: 'eating', locationId: '' },
    { startHour: 6, endHour: 12, action: 'working', locationId: AREA_TAGS.GARDEN },
    { startHour: 12, endHour: 13, action: 'eating', locationId: AREA_TAGS.CAFE },
    { startHour: 13, endHour: 16, action: 'working', locationId: AREA_TAGS.GARDEN },
    { startHour: 16, endHour: 18, action: 'wandering', locationId: AREA_TAGS.TOWN_SQUARE },
    { startHour: 18, endHour: 20, action: 'resting', locationId: '' },
    { startHour: 20, endHour: 5, action: 'sleeping', locationId: '' },
  ],
  shopkeeper: [
    { startHour: 7, endHour: 8, action: 'eating', locationId: '' },
    { startHour: 8, endHour: 12, action: 'working', locationId: AREA_TAGS.STORE },
    { startHour: 12, endHour: 13, action: 'eating', locationId: AREA_TAGS.CAFE },
    { startHour: 13, endHour: 18, action: 'working', locationId: AREA_TAGS.STORE },
    { startHour: 18, endHour: 20, action: 'socializing', locationId: AREA_TAGS.TOWN_SQUARE },
    { startHour: 20, endHour: 22, action: 'resting', locationId: '' },
    { startHour: 22, endHour: 7, action: 'sleeping', locationId: '' },
  ],
  carpenter: [
    { startHour: 6, endHour: 7, action: 'eating', locationId: '' },
    { startHour: 7, endHour: 12, action: 'working', locationId: AREA_TAGS.WORKSHOP },
    { startHour: 12, endHour: 13, action: 'eating', locationId: AREA_TAGS.TOWN_SQUARE },
    { startHour: 13, endHour: 17, action: 'working', locationId: AREA_TAGS.WORKSHOP },
    { startHour: 17, endHour: 19, action: 'wandering', locationId: AREA_TAGS.GARDEN },
    { startHour: 19, endHour: 21, action: 'resting', locationId: '' },
    { startHour: 21, endHour: 6, action: 'sleeping', locationId: '' },
  ],
  herbalist: [
    { startHour: 6, endHour: 7, action: 'eating', locationId: '' },
    { startHour: 7, endHour: 11, action: 'working', locationId: AREA_TAGS.GARDEN },
    { startHour: 11, endHour: 13, action: 'wandering', locationId: AREA_TAGS.LAKE },
    { startHour: 13, endHour: 14, action: 'eating', locationId: '' },
    { startHour: 14, endHour: 17, action: 'working', locationId: AREA_TAGS.GARDEN },
    { startHour: 17, endHour: 19, action: 'resting', locationId: '' },
    { startHour: 19, endHour: 6, action: 'sleeping', locationId: '' },
  ],
  musician: [
    { startHour: 9, endHour: 10, action: 'eating', locationId: AREA_TAGS.CAFE },
    { startHour: 10, endHour: 12, action: 'wandering', locationId: AREA_TAGS.LAKE },
    { startHour: 12, endHour: 13, action: 'eating', locationId: AREA_TAGS.CAFE },
    { startHour: 13, endHour: 15, action: 'resting', locationId: '' },
    { startHour: 15, endHour: 20, action: 'working', locationId: AREA_TAGS.TOWN_SQUARE },
    { startHour: 20, endHour: 23, action: 'socializing', locationId: AREA_TAGS.CAFE },
    { startHour: 23, endHour: 9, action: 'sleeping', locationId: '' },
  ],
};
