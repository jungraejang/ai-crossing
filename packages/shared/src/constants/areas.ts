export const AREA_TAGS = {
  TOWN_SQUARE: 'town_square',
  CAFE: 'cafe',
  STORE: 'store',
  GARDEN: 'garden',
  LAKE: 'lake',
  WORKSHOP: 'workshop',
  HOME_1: 'home_1',
  HOME_2: 'home_2',
  HOME_3: 'home_3',
  HOME_4: 'home_4',
  HOME_5: 'home_5',
  HOME_6: 'home_6',
  HOME_7: 'home_7',
  HOME_8: 'home_8',
  PATH: 'path',
  BRIDGE: 'bridge',
} as const;

export type AreaTag = (typeof AREA_TAGS)[keyof typeof AREA_TAGS];

export const SOCIAL_AREAS: AreaTag[] = [
  AREA_TAGS.TOWN_SQUARE,
  AREA_TAGS.CAFE,
  AREA_TAGS.STORE,
  AREA_TAGS.LAKE,
];

export const WORK_AREAS: AreaTag[] = [
  AREA_TAGS.CAFE,
  AREA_TAGS.STORE,
  AREA_TAGS.GARDEN,
  AREA_TAGS.WORKSHOP,
];
