import type { Villager, WorldState } from '@ai-crossing/shared';
import { AREA_TAGS } from '@ai-crossing/shared';
import { SCHEDULE_TEMPLATES } from '@ai-crossing/simulation';
import { useGameStore } from '@/stores/gameStore';
import { initGrid } from '@ai-crossing/simulation';
import { MAP_DATA } from '@/lib/mapData';
import { createAgent, clearAgents } from './villagerAgent';

const STARTER_VILLAGERS: Villager[] = [
  createVillager('maple', 'Maple', 'baker', ['cheerful', 'talkative'], ['baking new recipes', 'coffee tasting', 'morning walks by the lake', 'gossipping at the café'], AREA_TAGS.HOME_1, 5, 4),
  createVillager('jasper', 'Jasper', 'farmer', ['quiet', 'hardworking'], ['fishing at the lake', 'watching sunsets', 'tending flowers in the garden', 'whittling wood'], AREA_TAGS.HOME_2, 13, 4),
  createVillager('luna', 'Luna', 'shopkeeper', ['witty', 'curious'], ['reading at home', 'people-watching in the square', 'browsing the workshop', 'collecting rare items'], AREA_TAGS.HOME_3, 5, 19),
  createVillager('rowan', 'Rowan', 'carpenter', ['gruff', 'loyal'], ['carving figurines', 'hiking by the lake', 'fixing things around the village', 'sitting quietly in the garden'], AREA_TAGS.HOME_4, 23, 19),
  createVillager('sage', 'Sage', 'herbalist', ['gentle', 'mystical'], ['foraging herbs by the lake', 'meditation in the garden', 'stargazing', 'brewing herbal tea'], AREA_TAGS.HOME_5, 31, 19),
  createVillager('felix', 'Felix', 'musician', ['playful', 'dramatic'], ['performing in the town square', 'composing songs by the lake', 'dancing at the café', 'telling stories'], AREA_TAGS.HOME_3, 6, 19),
  createVillager('coral', 'Coral', 'fisher', ['quiet', 'gentle'], ['watching the sunrise over the lake', 'repairing nets', 'cooking fresh fish', 'napping under trees'], AREA_TAGS.HOME_6, 21, 4),
  createVillager('finn', 'Finn', 'guard', ['loyal', 'gruff'], ['patrolling the village paths', 'arm wrestling', 'telling war stories', 'stargazing from the bridge'], AREA_TAGS.HOME_7, 35, 4),
  createVillager('ivy', 'Ivy', 'painter', ['curious', 'gentle'], ['painting landscapes at the lake', 'sketching villagers in the square', 'mixing pigments from garden flowers', 'cloud watching'], AREA_TAGS.HOME_2, 14, 4),
  createVillager('milo', 'Milo', 'cook', ['cheerful', 'playful'], ['experimenting with recipes', 'taste-testing at the café', 'foraging wild mushrooms', 'hosting dinner parties'], AREA_TAGS.HOME_8, 35, 13),
  createVillager('pearl', 'Pearl', 'librarian', ['witty', 'mystical'], ['cataloging rare books', 'debating philosophy in the square', 'pressing wildflowers', 'writing poetry by the lake'], AREA_TAGS.HOME_4, 24, 19),
  createVillager('otto', 'Otto', 'blacksmith', ['gruff', 'hardworking'], ['forging tools at the workshop', 'testing metal strength', 'collecting ore samples', 'playing chess alone'], AREA_TAGS.HOME_5, 32, 19),
];

function createVillager(
  id: string,
  name: string,
  job: string,
  traits: string[],
  likes: string[],
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
    fisher: 'Relaxed and patient, tells long-winded stories about the one that got away',
    librarian: 'Precise and well-read, quotes proverbs and books',
    blacksmith: 'Booming voice, hearty laugh, speaks with conviction',
    painter: 'Dreamy and abstract, describes things in colors and textures',
    guard: 'Formal and watchful, speaks in clipped sentences like a report',
    cook: 'Enthusiastic about flavors, constantly offering food advice',
  };

  return {
    profile: {
      id,
      name,
      ageBand: 'adult',
      job: job as Villager['profile']['job'],
      traits,
      likes,
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
