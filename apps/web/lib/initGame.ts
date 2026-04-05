import type { Villager, WorldState } from '@ai-crossing/shared';
import { AREA_TAGS } from '@ai-crossing/shared';
import { SCHEDULE_TEMPLATES } from '@ai-crossing/simulation';
import { useGameStore } from '@/stores/gameStore';
import { initGrid } from '@ai-crossing/simulation';
import { MAP_DATA } from '@/lib/mapData';
import { createAgent, clearAgents } from './villagerAgent';

const STARTER_VILLAGERS: Villager[] = [
  createVillager('maple', 'Maple', 'baker', ['cheerful', 'talkative'], AREA_TAGS.HOME_1, 5, 4),
  createVillager('jasper', 'Jasper', 'farmer', ['quiet', 'hardworking'], AREA_TAGS.HOME_2, 13, 4),
  createVillager('luna', 'Luna', 'shopkeeper', ['witty', 'curious'], AREA_TAGS.HOME_3, 5, 19),
  createVillager('rowan', 'Rowan', 'carpenter', ['gruff', 'loyal'], AREA_TAGS.HOME_4, 23, 19),
  createVillager('sage', 'Sage', 'herbalist', ['gentle', 'mystical'], AREA_TAGS.HOME_5, 31, 19),
  createVillager('felix', 'Felix', 'musician', ['playful', 'dramatic'], AREA_TAGS.HOME_3, 6, 19),
];

function createVillager(
  id: string,
  name: string,
  job: string,
  traits: string[],
  homeId: string,
  x: number,
  y: number,
): Villager {
  const schedule = SCHEDULE_TEMPLATES[job] ?? [];
  const linkedSchedule = schedule.map((block) => ({
    ...block,
    locationId: block.locationId || homeId,
  }));

  const speakingStyles: Record<string, string> = {
    baker: 'Warm and encouraging, uses food metaphors',
    farmer: 'Simple and honest, speaks slowly',
    shopkeeper: 'Quick-witted, always has a deal to mention',
    carpenter: 'Direct and blunt, few words',
    herbalist: 'Soft and poetic, references nature',
    musician: 'Dramatic and expressive, speaks in rhythm',
  };

  return {
    profile: {
      id,
      name,
      ageBand: 'adult',
      job: job as Villager['profile']['job'],
      traits,
      likes: [],
      dislikes: [],
      homeId,
      speakingStyle: speakingStyles[job] ?? 'normal',
      dailySchedule: linkedSchedule,
    },
    state: {
      currentLocation: homeId,
      targetDestination: null,
      currentAction: { type: 'idle', startedAt: Date.now(), duration: 0 },
      hunger: 30,
      energy: 90,
      stress: 10,
      boredom: 20,
      sociability: 40,
      mood: 'content',
      inventory: [],
      relationshipMap: {},
      shortTermGoals: [],
      currentPlan: [],
      conversationContext: null,
      x,
      y,
      facing: 'down',
      isMoving: false,
      path: [],
    },
  };
}

export function initializeGame() {
  const { width, height, collision } = MAP_DATA;
  initGrid(width, height, collision);

  const world: WorldState = {
    time: { day: 1, hour: 6, minute: 0 },
    weather: 'clear',
    season: 'spring',
    locations: [],
    speed: 1,
    isPaused: false,
  };

  useGameStore.getState().initialize(world, STARTER_VILLAGERS);

  clearAgents();
  for (const v of STARTER_VILLAGERS) {
    createAgent(v.profile.id, v.profile.name);
  }

  console.log(`[Init] Created ${STARTER_VILLAGERS.length} villager agents`);
}
