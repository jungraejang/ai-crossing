import type { Villager, PlanResult } from '@ai-crossing/shared';
import { AREA_TAGS } from '@ai-crossing/shared';
import { useGameStore } from '@/stores/gameStore';

export interface VillagerPlan {
  villagerId: string;
  day: number;
  intentions: PlanIntention[];
  priority: string;
  avoidances: string[];
  status: 'pending' | 'fetching' | 'active' | 'failed';
}

export interface PlanIntention {
  text: string;
  targetLocation: string | null;
  targetVillagerId: string | null;
  executed: boolean;
}

const activePlans: Map<string, VillagerPlan> = new Map();
const planRequestsInFlight: Set<string> = new Set();
let lastPlanDay = 0;

const LOCATION_KEYWORDS: Record<string, string[]> = {
  [AREA_TAGS.CAFE]: ['café', 'cafe', 'coffee', 'pastry', 'eat', 'breakfast', 'lunch', 'drink', 'tavern'],
  [AREA_TAGS.TOWN_SQUARE]: ['square', 'town', 'center', 'gather', 'meet', 'hang out', 'socialize', 'perform', 'play music'],
  [AREA_TAGS.STORE]: ['store', 'shop', 'buy', 'supplies', 'stock', 'trade', 'purchase'],
  [AREA_TAGS.GARDEN]: ['garden', 'farm', 'crop', 'plant', 'harvest', 'tend', 'herbs', 'flowers', 'grow'],
  [AREA_TAGS.LAKE]: ['lake', 'water', 'fish', 'bridge', 'swim', 'relax by', 'walk by the', 'stroll', 'nature'],
  [AREA_TAGS.WORKSHOP]: ['workshop', 'craft', 'build', 'repair', 'fix', 'wood', 'carpentry', 'tools'],
};

const VILLAGER_KEYWORDS: Record<string, string[]> = {
  maple: ['maple', 'baker'],
  jasper: ['jasper', 'farmer'],
  luna: ['luna', 'shopkeeper'],
  rowan: ['rowan', 'carpenter'],
  sage: ['sage', 'herbalist'],
  felix: ['felix', 'musician'],
};

function parseIntention(text: string, villager: Villager): PlanIntention {
  const lower = text.toLowerCase();

  let targetLocation: string | null = null;
  for (const [locId, keywords] of Object.entries(LOCATION_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      targetLocation = locId;
      break;
    }
  }

  let targetVillagerId: string | null = null;
  for (const [id, keywords] of Object.entries(VILLAGER_KEYWORDS)) {
    if (id !== villager.profile.id && keywords.some((kw) => lower.includes(kw))) {
      targetVillagerId = id;
      break;
    }
  }

  if (targetVillagerId && !targetLocation) {
    const store = useGameStore.getState();
    const target = store.villagers.find((v) => v.profile.id === targetVillagerId);
    if (target) {
      targetLocation = target.state.currentLocation;
    }
  }

  return {
    text,
    targetLocation,
    targetVillagerId,
    executed: false,
  };
}

export async function requestPlan(villager: Villager, day: number): Promise<void> {
  const key = villager.profile.id;
  if (planRequestsInFlight.has(key)) return;

  const existing = activePlans.get(key);
  if (existing && existing.day === day) return;

  planRequestsInFlight.add(key);

  activePlans.set(key, {
    villagerId: villager.profile.id,
    day,
    intentions: [],
    priority: '',
    avoidances: [],
    status: 'fetching',
  });

  const store = useGameStore.getState();
  const allVillagers = store.villagers;

  const relationshipNames: Record<string, number> = {};
  for (const [id, score] of Object.entries(villager.state.relationshipMap)) {
    const other = allVillagers.find((v) => v.profile.id === id);
    if (other) {
      relationshipNames[other.profile.name] = score;
    }
  }

  try {
    const res = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        villagerName: villager.profile.name,
        personality: villager.profile.traits.join(', '),
        currentGoals: villager.state.shortTermGoals,
        relationships: relationshipNames,
        yesterdayMemories: [],
        weather: store.world.weather,
        availableLocations: [
          'Town Square', 'Café', 'General Store', 'Garden', 'Lake', 'Workshop',
        ],
      }),
    });

    if (!res.ok) throw new Error(`Plan API ${res.status}`);
    const result = (await res.json()) as PlanResult;

    const intentions = result.intentions.map((text) => parseIntention(text, villager));

    activePlans.set(key, {
      villagerId: villager.profile.id,
      day,
      intentions,
      priority: result.priority,
      avoidances: result.avoidances,
      status: 'active',
    });

    store.updateVillager(villager.profile.id, {
      currentPlan: result.intentions,
      shortTermGoals: [result.priority],
    });

    store.addSpeechBubble({
      id: `plan_${Date.now()}_${villager.profile.id}`,
      villagerId: villager.profile.id,
      text: `💭 ${result.priority}`,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5000,
    });

    store.pushEvent({
      id: `evt_plan_${Date.now()}_${villager.profile.id}`,
      event: {
        type: 'MEMORY_CREATED',
        villagerId: villager.profile.id,
        memory: {
          id: `plan_mem_${Date.now()}`,
          villagerId: villager.profile.id,
          type: 'episodic',
          importance: 0.6,
          summary: `Planned the day: ${result.priority}`,
          relatedActorIds: [],
          tags: ['plan', 'morning'],
          timestamp: Date.now(),
          gameDay: day,
        },
        timestamp: Date.now(),
      },
      gameTime: store.world.time,
      realTimestamp: Date.now(),
    });

    console.log(`[Plan] ${villager.profile.name}: ${result.intentions.join(' | ')}`);
  } catch (err) {
    console.error(`[Plan] Failed for ${villager.profile.name}:`, err);
    activePlans.set(key, {
      villagerId: villager.profile.id,
      day,
      intentions: [],
      priority: 'Have a normal day',
      avoidances: [],
      status: 'failed',
    });
  } finally {
    planRequestsInFlight.delete(key);
  }
}

export function getPlan(villagerId: string): VillagerPlan | null {
  return activePlans.get(villagerId) ?? null;
}

export function getNextUnexecutedIntention(villagerId: string): PlanIntention | null {
  const plan = activePlans.get(villagerId);
  if (!plan || plan.status !== 'active') return null;
  return plan.intentions.find((i) => !i.executed) ?? null;
}

export function markIntentionExecuted(villagerId: string, index: number): void {
  const plan = activePlans.get(villagerId);
  if (!plan) return;
  const intention = plan.intentions[index];
  if (intention) intention.executed = true;
}

export function shouldRequestPlans(gameHour: number, gameDay: number): boolean {
  if (gameDay === lastPlanDay) return false;
  if (gameHour >= 6 && gameHour < 7) {
    lastPlanDay = gameDay;
    return true;
  }
  return false;
}

export function shouldVillagerAvoid(villagerId: string, otherId: string): boolean {
  const plan = activePlans.get(villagerId);
  if (!plan || plan.status !== 'active') return false;

  const store = useGameStore.getState();
  const other = store.villagers.find((v) => v.profile.id === otherId);
  if (!other) return false;

  return plan.avoidances.some((a) => {
    const lower = a.toLowerCase();
    return lower.includes(other.profile.name.toLowerCase()) || lower.includes(other.profile.job);
  });
}
