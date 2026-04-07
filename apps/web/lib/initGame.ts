import type { Villager, WorldState } from '@ai-crossing/shared';
import { AREA_TAGS } from '@ai-crossing/shared';
import { SCHEDULE_TEMPLATES } from '@ai-crossing/simulation';
import { useGameStore } from '@/stores/gameStore';
import { initGrid } from '@ai-crossing/simulation';
import { MAP_DATA } from '@/lib/mapData';
import { createAgent, clearAgents } from './villagerAgent';

const STARTER_VILLAGERS: Villager[] = [
  createVillager('maple', 'Maple', 'baker', ['cheerful', 'talkative'], ['baking new recipes', 'coffee tasting', 'morning walks by the lake', 'gossipping at the café'], AREA_TAGS.HOME_1, 5, 4),
  createVillager('jasper', 'Jasper', 'farmer', ['quiet', 'hardworking'], ['fishing at the lake', 'watching sunsets', 'tending flowers in the garden', 'whittling wood'], AREA_TAGS.HOME_2, 17, 4),
  createVillager('luna', 'Luna', 'shopkeeper', ['witty', 'curious'], ['reading at home', 'people-watching in the square', 'browsing the workshop', 'collecting rare items'], AREA_TAGS.HOME_3, 5, 29),
  createVillager('rowan', 'Rowan', 'carpenter', ['gruff', 'loyal'], ['carving figurines', 'hiking by the lake', 'fixing things around the village', 'sitting quietly in the garden'], AREA_TAGS.HOME_4, 33, 29),
  createVillager('sage', 'Sage', 'herbalist', ['gentle', 'mystical'], ['foraging herbs by the lake', 'meditation in the garden', 'stargazing', 'brewing herbal tea'], AREA_TAGS.HOME_5, 47, 29),
  createVillager('felix', 'Felix', 'musician', ['playful', 'dramatic'], ['performing in the town square', 'composing songs by the lake', 'dancing at the café', 'telling stories'], AREA_TAGS.HOME_3, 6, 29),
  createVillager('coral', 'Coral', 'fisher', ['quiet', 'gentle'], ['watching the sunrise over the lake', 'repairing nets', 'cooking fresh fish', 'napping under trees'], AREA_TAGS.HOME_6, 29, 4),
  createVillager('finn', 'Finn', 'guard', ['loyal', 'gruff'], ['patrolling the village paths', 'arm wrestling', 'telling war stories', 'stargazing from the bridge'], AREA_TAGS.HOME_7, 53, 4),
  createVillager('ivy', 'Ivy', 'painter', ['curious', 'gentle'], ['painting landscapes at the lake', 'sketching villagers in the square', 'mixing pigments from garden flowers', 'cloud watching'], AREA_TAGS.HOME_2, 18, 4),
  createVillager('milo', 'Milo', 'cook', ['cheerful', 'playful'], ['experimenting with recipes', 'taste-testing at the café', 'foraging wild mushrooms', 'hosting dinner parties'], AREA_TAGS.HOME_8, 53, 19),
  createVillager('pearl', 'Pearl', 'librarian', ['witty', 'mystical'], ['cataloging rare books', 'debating philosophy in the square', 'pressing wildflowers', 'writing poetry by the lake'], AREA_TAGS.HOME_4, 34, 29),
  createVillager('otto', 'Otto', 'blacksmith', ['gruff', 'hardworking'], ['forging tools at the workshop', 'testing metal strength', 'collecting ore samples', 'playing chess alone'], AREA_TAGS.HOME_5, 48, 29),
  createVillager('hazel', 'Hazel', 'tailor', ['creative', 'gentle'], ['sewing dresses', 'collecting fabrics', 'fashion sketching', 'tea at the café'], AREA_TAGS.HOME_9, 17, 12),
  createVillager('cliff', 'Cliff', 'miner', ['gruff', 'hardworking'], ['exploring caves', 'collecting gems', 'arm wrestling', 'campfire stories'], AREA_TAGS.HOME_9, 18, 12),
  createVillager('wren', 'Wren', 'doctor', ['gentle', 'curious'], ['mixing medicines', 'reading journals', 'morning jogs by the lake', 'helping others'], AREA_TAGS.HOME_10, 29, 12),
  createVillager('birch', 'Birch', 'beekeeper', ['quiet', 'mystical'], ['tending beehives in the garden', 'making honey', 'watching bees dance', 'nature walks'], AREA_TAGS.HOME_10, 30, 12),
  createVillager('ember', 'Ember', 'sailor', ['playful', 'loyal'], ['fishing at the lake', 'telling sea tales', 'knot tying', 'stargazing from the bridge'], AREA_TAGS.HOME_11, 17, 37),
  createVillager('fern', 'Fern', 'teacher', ['cheerful', 'witty'], ['tutoring in the square', 'writing lesson plans', 'picking wildflowers', 'debating with Pearl'], AREA_TAGS.HOME_11, 18, 37),
  createVillager('slate', 'Slate', 'mason', ['gruff', 'loyal'], ['building stone walls', 'sculpting', 'heavy lifting', 'sitting by the fountain'], AREA_TAGS.HOME_12, 39, 37),
  createVillager('poppy', 'Poppy', 'florist', ['cheerful', 'gentle'], ['arranging bouquets', 'growing roses in the garden', 'decorating the café', 'singing'], AREA_TAGS.HOME_3, 7, 29),
  createVillager('reed', 'Reed', 'ranger', ['quiet', 'hardworking'], ['patrolling the lake shore', 'tracking animals', 'whittling arrows', 'dawn hikes'], AREA_TAGS.HOME_7, 54, 4),
  createVillager('dusk', 'Dusk', 'astronomer', ['mystical', 'curious'], ['stargazing', 'mapping constellations', 'writing theories', 'night walks'], AREA_TAGS.HOME_6, 30, 4),
  createVillager('cinder', 'Cinder', 'potter', ['creative', 'playful'], ['shaping clay at the workshop', 'glazing pots', 'decorating homes', 'humming tunes'], AREA_TAGS.HOME_1, 6, 4),
  createVillager('flint', 'Flint', 'hunter', ['quiet', 'gruff'], ['tracking in the garden', 'sharpening tools', 'smoking fish', 'lakeside campfires'], AREA_TAGS.HOME_8, 54, 19),
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
    tailor: 'Elegant and precise, speaks about patterns and details with passion',
    miner: 'Rough and earthy, uses mining metaphors, speaks with a rumble',
    doctor: 'Calm and reassuring, clinical but caring, asks how you feel',
    beekeeper: 'Slow and meditative, speaks in quiet buzzing rhythms about nature',
    sailor: 'Bold and salty, uses nautical slang, tells tall tales',
    teacher: 'Patient and articulate, explains things clearly, asks questions',
    mason: 'Measured and steady, speaks about foundations and building things right',
    florist: 'Bright and fragrant, speaks in flower metaphors, always cheerful',
    ranger: 'Terse and observant, speaks about tracks and signs in nature',
    astronomer: 'Dreamy and cosmic, references stars and vastness, philosophical',
    potter: 'Tactile and creative, speaks about shapes and feeling the clay',
    hunter: 'Laconic and watchful, few words, speaks about patience and the wild',
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
      facing: 'south',
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
