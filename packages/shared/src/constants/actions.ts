import type { ActionType } from '../types/villager';

export const ACTION_DURATIONS: Record<ActionType, number> = {
  idle: 0,
  walking: 0,
  working: 60,
  eating: 20,
  sleeping: 480,
  socializing: 15,
  resting: 30,
  wandering: 20,
  shopping: 15,
  crafting: 45,
};

export const ACTION_LABELS: Record<ActionType, string> = {
  idle: 'Standing around',
  walking: 'Walking',
  working: 'Working',
  eating: 'Eating',
  sleeping: 'Sleeping',
  socializing: 'Chatting',
  resting: 'Resting',
  wandering: 'Wandering',
  shopping: 'Shopping',
  crafting: 'Crafting',
};

export const INTERACTION_TYPES = [
  'greet',
  'small_talk',
  'argue',
  'help',
  'ignore',
  'gift',
  'insult',
] as const;

export type InteractionType = (typeof INTERACTION_TYPES)[number];

export const INTERACTION_RELATIONSHIP_DELTAS: Record<InteractionType, number> = {
  greet: 1,
  small_talk: 2,
  help: 5,
  gift: 5,
  argue: -10,
  ignore: -1,
  insult: -10,
};

export const MOVEMENT_SPEED_TILES_PER_SECOND = 2.5;
