import { useGameStore } from '@/stores/gameStore';
import type { Villager, ActionType, GameEventLog, ScheduleBlock } from '@ai-crossing/shared';
import {
  NEED_DECAY_RATES,
  NEED_THRESHOLDS,
  MOVEMENT_SPEED_TILES_PER_SECOND,
  AREA_TAGS,
} from '@ai-crossing/shared';
import { findPath } from '@ai-crossing/simulation';
import { getAgent } from './villagerAgent';
import { startConversation, isInActiveConversation } from './conversationSession';

let tickCounter = 0;
let lastEncounterCheck: Record<string, number> = {};
const mealCooldownUntil: Map<string, number> = new Map();

export function simulationTick(dt: number) {
  const store = useGameStore.getState();
  const { world, villagers } = store;

  store.advanceTime(dt);

  const gameTimeDt = dt * world.speed;
  const totalGameMinutes = world.time.day * 1440 + world.time.hour * 60 + world.time.minute;

  let updatedVillagers = villagers.map((v) => {
    let state = { ...v.state };

    state = decayNeeds(state, dt, world.speed);

    const agent = getAgent(v.profile.id);
    const inConvo = agent?.inConversation ?? false;

    if (!inConvo) {
      const prevAction = state.currentAction?.type;
      state = enforceSchedule(v, state, world.time.hour, totalGameMinutes);
      runAgentFreeTime({ ...v, state }, agent, totalGameMinutes, world.time.hour);
      state = updateMovement(state, dt, world.speed);
      state = workplaceFidget(v.profile.id, state, dt, world.speed);

      if (prevAction && prevAction !== 'idle' && prevAction !== 'walking' && state.currentAction?.type === 'idle') {
        agent?.requestThink();
      }
    }

    const prevActionAfterBehavior = state.currentAction?.type;
    state = processAction(v.profile.id, state, gameTimeDt, totalGameMinutes);
    if (
      prevActionAfterBehavior &&
      prevActionAfterBehavior !== 'idle' &&
      prevActionAfterBehavior !== 'walking' &&
      state.currentAction?.type === 'idle'
    ) {
      agent?.requestThink();
    }

    return { ...v, state };
  });

  updatedVillagers = applySeparation(updatedVillagers, dt);
  store.setVillagers(updatedVillagers);

  tickCounter++;
  if (tickCounter % 25 === 0) {
    checkEncounters(updatedVillagers);
  }
  if (tickCounter % 60 === 0) {
    store.clearExpiredBubbles();
  }
  if (tickCounter % 3600 === 0) {
    pruneEncounterCache();
  }
}

function pruneEncounterCache() {
  const now = Date.now();
  const maxAge = 60000;
  for (const key of Object.keys(lastEncounterCheck)) {
    if (now - lastEncounterCheck[key]! > maxAge) {
      delete lastEncounterCheck[key];
    }
  }
}

function hasRecentMeal(villagerId: string, totalGameMinutes: number): boolean {
  const until = mealCooldownUntil.get(villagerId);
  if (until === undefined) return false;
  if (totalGameMinutes >= until) {
    mealCooldownUntil.delete(villagerId);
    return false;
  }
  return true;
}

function getScheduleBlock(villager: Villager, hour: number): ScheduleBlock | null {
  return villager.profile.dailySchedule.find((b) => {
    if (b.startHour <= b.endHour) {
      return hour >= b.startHour && hour < b.endHour;
    }
    return hour >= b.startHour || hour < b.endHour;
  }) ?? null;
}

type RoutineType = 'work' | 'sleep' | 'eat' | 'free';

function classifyScheduleBlock(block: ScheduleBlock | null): RoutineType {
  if (!block) return 'free';
  if (block.action === 'sleeping') return 'sleep';
  if (block.action === 'working') return 'work';
  if (block.action === 'eating') return 'eat';
  return 'free';
}

function enforceSchedule(
  villager: Villager,
  state: Villager['state'],
  currentHour: number,
  totalGameMinutes: number,
): Villager['state'] {
  if (state.isMoving) return state;

  const currentAction = state.currentAction?.type;

  if (currentAction === 'sleeping' || currentAction === 'working') {
    return state;
  }
  if (currentAction === 'eating') {
    return state;
  }
  if (currentAction === 'wandering' || currentAction === 'socializing' || currentAction === 'resting' || currentAction === 'shopping' || currentAction === 'crafting') {
    return state;
  }

  if (state.energy <= NEED_THRESHOLDS.energy.urgent) {
    return enforceGoToAndDo(villager, state, villager.profile.homeId, 'sleeping', 60);
  }

  if (state.hunger >= NEED_THRESHOLDS.hunger.urgent && !hasRecentMeal(villager.profile.id, totalGameMinutes)) {
    const eatLoc = canEatHere(state.currentLocation, villager.profile.homeId)
      ? state.currentLocation
      : pickEatLocation(villager.profile.homeId);
    return enforceGoToAndDo(villager, state, eatLoc, 'eating', 15);
  }

  const block = getScheduleBlock(villager, currentHour);
  const routine = classifyScheduleBlock(block);

  if (routine === 'sleep') {
    return enforceGoToAndDo(villager, state, villager.profile.homeId, 'sleeping', 60);
  }

  if (routine === 'work') {
    const targetLoc = block!.locationId || villager.profile.homeId;
    return enforceGoToAndDo(villager, state, targetLoc, 'working', 45);
  }

  if (routine === 'eat') {
    if (state.hunger >= 50 && !hasRecentMeal(villager.profile.id, totalGameMinutes)) {
      const targetLoc = block!.locationId || villager.profile.homeId;
      const eatLoc = canEatHere(targetLoc, villager.profile.homeId) ? targetLoc : pickEatLocation(villager.profile.homeId);
      return enforceGoToAndDo(villager, state, eatLoc, 'eating', 15);
    }
    return applyFreeTimeFallback(villager, state, block, totalGameMinutes);
  }

  if (!currentAction || currentAction === 'idle') {
    return applyFreeTimeFallback(villager, state, block, totalGameMinutes);
  }

  return state;
}

function canEatHere(location: string, homeId: string): boolean {
  return location === homeId || location === AREA_TAGS.CAFE;
}

function pickEatLocation(homeId: string): string {
  return Math.random() < 0.3 ? AREA_TAGS.CAFE : homeId;
}

function startActionInPlace(state: Villager['state'], type: ActionType, duration: number): Villager['state'] {
  return { ...state, currentAction: { type, startedAt: Date.now(), duration, gameTimeElapsed: 0 } };
}

function enforceGoToAndDo(
  villager: Villager,
  state: Villager['state'],
  targetLoc: string,
  actionType: ActionType,
  duration: number,
): Villager['state'] {
  if (state.currentLocation !== targetLoc && !state.isMoving) {
    return {
      ...state,
      targetDestination: targetLoc,
      currentAction: { type: 'idle', startedAt: Date.now(), duration: 0 },
    };
  }
  if (state.currentLocation === targetLoc) {
    if (state.currentAction?.type !== actionType) {
      return { ...state, currentAction: { type: actionType, startedAt: Date.now(), duration, gameTimeElapsed: 0 } };
    }
  }
  return state;
}

function applyFreeTimeFallback(
  villager: Villager,
  state: Villager['state'],
  block: ScheduleBlock | null,
  totalGameMinutes: number,
): Villager['state'] {
  if (state.hunger >= NEED_THRESHOLDS.hunger.high && !hasRecentMeal(villager.profile.id, totalGameMinutes)) {
    if (canEatHere(state.currentLocation, villager.profile.homeId)) {
      return { ...state, currentAction: { type: 'eating', startedAt: Date.now(), duration: 15, gameTimeElapsed: 0 } };
    }
    const eatLoc = pickEatLocation(villager.profile.homeId);
    return { ...state, targetDestination: eatLoc, currentAction: { type: 'idle', startedAt: Date.now(), duration: 0 } };
  }

  if (state.sociability >= NEED_THRESHOLDS.sociability.high) {
    const socialLoc = block?.locationId || AREA_TAGS.TOWN_SQUARE;
    if (state.currentLocation !== socialLoc) {
      return { ...state, targetDestination: socialLoc, currentAction: { type: 'idle', startedAt: Date.now(), duration: 0 } };
    }
    return { ...state, currentAction: { type: 'socializing', startedAt: Date.now(), duration: 10, gameTimeElapsed: 0 } };
  }

  if (state.boredom >= 50) {
    return { ...state, currentAction: { type: 'wandering', startedAt: Date.now(), duration: 15, gameTimeElapsed: 0 } };
  }

  if (state.stress >= 40) {
    return { ...state, currentAction: { type: 'resting', startedAt: Date.now(), duration: 20, gameTimeElapsed: 0 } };
  }

  if (block?.locationId && state.currentLocation !== block.locationId) {
    return { ...state, targetDestination: block.locationId, currentAction: { type: 'idle', startedAt: Date.now(), duration: 0 } };
  }

  const freeActions: ActionType[] = ['wandering', 'resting', 'socializing'];
  const pick = freeActions[Math.floor(Math.random() * freeActions.length)]!;
  return { ...state, currentAction: { type: pick, startedAt: Date.now(), duration: 15, gameTimeElapsed: 0 } };
}

function runAgentFreeTime(
  villager: Villager,
  agent: ReturnType<typeof getAgent>,
  totalGameMinutes: number,
  currentHour: number,
) {
  if (!agent) return;

  const block = getScheduleBlock(villager, currentHour);
  const routine = classifyScheduleBlock(block);
  if (routine === 'work' || routine === 'sleep' || routine === 'eat') return;

  if (!agent.shouldThink(villager, totalGameMinutes)) return;

  const store = useGameStore.getState();
  const perception = agent.perceive(store.villagers, store.world, getRecentEventDescriptions());

  const hobbies = villager.profile.likes.length > 0
    ? `Your hobbies/interests: ${villager.profile.likes.join(', ')}.`
    : '';

  const timeLabel = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';

  let context = `You have free time right now. ${hobbies} It is ${timeLabel} (${currentHour}:00). Choose something enjoyable to do — visit a location, pursue a hobby, socialize, or explore the village. Don't just stand around!`;

  if (villager.state.hunger >= NEED_THRESHOLDS.hunger.high) {
    context += ' You are getting hungry — consider eating.';
  }
  if (villager.state.energy <= NEED_THRESHOLDS.energy.high) {
    context += ' You are getting tired — consider resting.';
  }
  if (villager.state.sociability >= NEED_THRESHOLDS.sociability.high) {
    context += ' You really want to talk to someone.';
  }
  if (villager.state.boredom >= 50) {
    context += ' You are bored — do something fun!';
  }

  agent.think(villager, perception, totalGameMinutes, context).then((result) => {
    if (!result) return;
    if (result.action === 'idle') return;

    const currentStore = useGameStore.getState();
    const currentVillager = currentStore.villagers.find((v) => v.profile.id === villager.profile.id);
    if (!currentVillager) return;

    const block2 = getScheduleBlock(currentVillager, currentStore.world.time.hour);
    const routine2 = classifyScheduleBlock(block2);
    if (routine2 === 'work' || routine2 === 'sleep' || routine2 === 'eat') return;

    const currentActionType = currentVillager.state.currentAction?.type;
    if (currentActionType && currentActionType !== 'idle' && currentActionType !== 'walking') {
      return;
    }

    const stateUpdates = agent.act(currentVillager, result);
    if (stateUpdates) {
      currentStore.updateVillager(villager.profile.id, stateUpdates);
    }

    agent.reflect(result, currentVillager);
  });
}

const LOCATION_LABELS: Record<string, string> = {
  [AREA_TAGS.TOWN_SQUARE]: 'Town Square',
  [AREA_TAGS.CAFE]: 'Café',
  [AREA_TAGS.STORE]: 'General Store',
  [AREA_TAGS.GARDEN]: 'Garden',
  [AREA_TAGS.LAKE]: 'Lake',
  [AREA_TAGS.WORKSHOP]: 'Workshop',
  [AREA_TAGS.HOME_1]: 'Home',
  [AREA_TAGS.HOME_2]: 'Home',
  [AREA_TAGS.HOME_3]: 'Home',
  [AREA_TAGS.HOME_4]: 'Home',
  [AREA_TAGS.HOME_5]: 'Home',
  [AREA_TAGS.HOME_6]: 'Home',
  [AREA_TAGS.HOME_7]: 'Home',
  [AREA_TAGS.HOME_8]: 'Home',
  [AREA_TAGS.HOME_9]: 'Home',
  [AREA_TAGS.HOME_10]: 'Home',
  [AREA_TAGS.HOME_11]: 'Home',
  [AREA_TAGS.HOME_12]: 'Home',
};

function getRecentEventDescriptions(): string[] {
  const store = useGameStore.getState();
  const villagers = store.villagers;
  const getName = (id: string) => villagers.find((v) => v.profile.id === id)?.profile.name ?? id;

  return store.eventLog.slice(-8).map((e) => {
    const evt = e.event as unknown as Record<string, unknown>;
    const type = evt.type as string;
    switch (type) {
      case 'SOCIAL_INVITE':
        return `${getName(evt.fromId as string)} interacted with ${getName(evt.toId as string)}`;
      case 'ENTER_AREA':
        return `${getName(evt.villagerId as string)} entered ${evt.areaTag as string}`;
      default:
        return '';
    }
  }).filter(Boolean);
}

function decayNeeds(
  state: Villager['state'],
  dt: number,
  speed: number,
): Villager['state'] {
  const factor = dt * speed;
  let hunger = state.hunger + NEED_DECAY_RATES.hunger * factor;
  let energy = state.energy - NEED_DECAY_RATES.energy * factor;
  let stress = state.stress + NEED_DECAY_RATES.stress * factor;
  let boredom = state.boredom + NEED_DECAY_RATES.boredom * factor;
  let sociability = state.sociability + NEED_DECAY_RATES.sociability * factor;

  // Continuous recovery while actions are happening.
  // This avoids the "stuck action means no recovery" failure mode and
  // makes needs visibly change during the action.
  switch (state.currentAction?.type) {
    case 'eating':
      // While eating, do not also passively get hungrier.
      // A full meal should meaningfully lower the hunger need in one session.
      hunger = state.hunger - 4.0 * factor;
      energy += 0.25 * factor;
      break;
    case 'sleeping':
      energy += 1.3 * factor;
      stress -= 0.35 * factor;
      break;
    case 'resting':
      energy += 0.5 * factor;
      stress -= 0.45 * factor;
      break;
    case 'socializing':
      sociability -= 0.9 * factor;
      boredom -= 0.35 * factor;
      stress -= 0.05 * factor;
      break;
    case 'wandering':
      boredom -= 0.45 * factor;
      stress -= 0.08 * factor;
      energy -= 0.08 * factor;
      break;
    case 'working':
      boredom -= 0.12 * factor;
      stress += 0.08 * factor;
      hunger += 0.12 * factor;
      energy -= 0.18 * factor;
      break;
    default:
      break;
  }

  return {
    ...state,
    hunger: Math.max(0, Math.min(100, hunger)),
    energy: Math.max(0, Math.min(100, energy)),
    stress: Math.max(0, Math.min(100, stress)),
    boredom: Math.max(0, Math.min(100, boredom)),
    sociability: Math.max(0, Math.min(100, sociability)),
  };
}

function updateMovement(
  state: Villager['state'],
  dt: number,
  speed: number,
): Villager['state'] {
  if (state.path.length === 0) {
    if (state.targetDestination && state.currentLocation !== state.targetDestination) {
      const target = getLocationCoords(state.targetDestination);
      if (target) {
        const newPath = findPath(Math.round(state.x), Math.round(state.y), target.x, target.y);
        if (newPath.length > 1) {
          return {
            ...state,
            path: newPath.slice(1),
            isMoving: true,
            currentAction: { type: 'walking', startedAt: Date.now(), duration: 0 },
          };
        } else {
          return {
            ...state,
            currentLocation: state.targetDestination,
            targetDestination: null,
            currentAction: { type: 'idle', startedAt: Date.now(), duration: 0 },
          };
        }
      }
    }
    return state;
  }

  const moveSpeed = MOVEMENT_SPEED_TILES_PER_SECOND * dt * speed;
  const next = state.path[0]!;
  const dx = next.x - state.x;
  const dy = next.y - state.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  let facing = state.facing;
  if (Math.abs(dx) > Math.abs(dy)) {
    facing = dx > 0 ? 'right' : 'left';
  } else if (dy !== 0) {
    facing = dy > 0 ? 'down' : 'up';
  }

  if (dist <= moveSpeed) {
    const remainingPath = state.path.slice(1);
    const arrived = remainingPath.length === 0;
    return {
      ...state,
      x: next.x,
      y: next.y,
      facing,
      path: remainingPath,
      isMoving: !arrived,
      currentLocation: arrived ? (state.targetDestination ?? state.currentLocation) : state.currentLocation,
      targetDestination: arrived ? null : state.targetDestination,
      currentAction: arrived
        ? { type: 'idle', startedAt: Date.now(), duration: 0 }
        : state.currentAction,
    };
  }

  return {
    ...state,
    x: state.x + (dx / dist) * moveSpeed,
    y: state.y + (dy / dist) * moveSpeed,
    facing,
    isMoving: true,
  };
}

function processAction(
  villagerId: string,
  state: Villager['state'],
  gameTimeDt: number,
  totalGameMinutes: number,
): Villager['state'] {
  const action = state.currentAction;
  if (!action || action.type === 'idle' || action.type === 'walking') return state;

  const gameMinutesElapsed = (action.gameTimeElapsed ?? 0) + gameTimeDt;
  const durationMinutes = action.duration;

  if (durationMinutes > 0 && gameMinutesElapsed >= durationMinutes) {
    const updated = { ...state };
    if (action.type === 'eating') {
      updated.hunger = Math.min(updated.hunger, 20);
      mealCooldownUntil.set(villagerId, totalGameMinutes + 90);
    }
    updated.currentAction = { type: 'idle', startedAt: Date.now(), duration: 0 };
    updated.mood = calculateMood(updated);
    return updated;
  }

  return { ...state, currentAction: { ...action, gameTimeElapsed: gameMinutesElapsed } };
}

const fidgetTimers: Map<string, number> = new Map();

function workplaceFidget(
  villagerId: string,
  state: Villager['state'],
  dt: number,
  speed: number,
): Villager['state'] {
  const action = state.currentAction?.type;
  // Only workers should shuffle around their workplace.
  // Moving eaters/socializers interrupts the action before `processAction`
  // can apply recovery, which causes loops.
  if (action !== 'working') return state;
  if (state.isMoving || state.path.length > 0) return state;

  const loc = state.currentLocation;
  const positions = locationPositions[loc];
  if (!positions || positions.length <= 1) return state;

  const timer = (fidgetTimers.get(villagerId) ?? 0) + dt * speed;
  const fidgetInterval = 8 + Math.random() * 4;

  if (timer < fidgetInterval) {
    fidgetTimers.set(villagerId, timer);
    return state;
  }

  fidgetTimers.set(villagerId, 0);

  const current = { x: Math.round(state.x), y: Math.round(state.y) };
  const others = positions.filter((p) => p.x !== current.x || p.y !== current.y);
  if (others.length === 0) return state;

  const target = others[Math.floor(Math.random() * others.length)]!;

  const dx = target.x - state.x;
  const dy = target.y - state.y;
  let facing = state.facing;
  if (Math.abs(dx) > Math.abs(dy)) {
    facing = dx > 0 ? 'right' : 'left';
  } else if (dy !== 0) {
    facing = dy > 0 ? 'down' : 'up';
  }

  return {
    ...state,
    path: [target],
    isMoving: true,
    facing,
  };
}

function calculateMood(state: Villager['state']): Villager['state']['mood'] {
  if (state.hunger >= 80) return 'hungry';
  if (state.energy <= 20) return 'tired';
  if (state.stress >= 70) return 'stressed';
  if (state.sociability >= 80) return 'lonely';
  if (state.boredom >= 80) return 'sad';
  if (state.stress <= 20 && state.energy >= 60 && state.hunger <= 30) return 'happy';
  if (state.energy >= 40 && state.hunger <= 50) return 'content';
  return 'neutral';
}

function applySeparation(villagers: Villager[], dt: number): Villager[] {
  const minDist = 1.2;
  const pushStrength = 2.0;

  return villagers.map((v, i) => {
    if (v.state.isMoving) return v;

    let pushX = 0;
    let pushY = 0;

    for (let j = 0; j < villagers.length; j++) {
      if (i === j) continue;
      const other = villagers[j]!;
      const dx = v.state.x - other.state.x;
      const dy = v.state.y - other.state.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDist && dist > 0.01) {
        const force = (minDist - dist) / minDist;
        pushX += (dx / dist) * force * pushStrength;
        pushY += (dy / dist) * force * pushStrength;
      }
    }

    if (Math.abs(pushX) < 0.001 && Math.abs(pushY) < 0.001) return v;

    return {
      ...v,
      state: {
        ...v.state,
        x: v.state.x + pushX * dt,
        y: v.state.y + pushY * dt,
      },
    };
  });
}

function startWorkChat(a: Villager, b: Villager) {
  startConversation(a, b, true);
}

function checkEncounters(villagers: Villager[]) {
  const store = useGameStore.getState();
  const now = Date.now();

  for (let i = 0; i < villagers.length; i++) {
    for (let j = i + 1; j < villagers.length; j++) {
      const a = villagers[i]!;
      const b = villagers[j]!;

      if (a.state.isMoving || b.state.isMoving) continue;
      if (
        a.state.currentAction?.type === 'sleeping' ||
        b.state.currentAction?.type === 'sleeping' ||
        a.state.currentAction?.type === 'eating' ||
        b.state.currentAction?.type === 'eating'
      ) continue;
      if (isInActiveConversation(a.profile.id) || isInActiveConversation(b.profile.id)) continue;

      const dx = a.state.x - b.state.x;
      const dy = a.state.y - b.state.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const sameLocation = a.state.currentLocation === b.state.currentLocation
        && a.state.currentLocation !== '';

      const interactionRange = sameLocation ? 8 : 3;

      if (dist < interactionRange) {
        const cooldownMs = sameLocation ? 8000 : 15000;

        const pairKey = [a.profile.id, b.profile.id].sort().join(':');
        const lastTime = lastEncounterCheck[pairKey] ?? 0;
        if (now - lastTime < cooldownMs) continue;
        lastEncounterCheck[pairKey] = now;

        const bothWorking = a.state.currentAction?.type === 'working' && b.state.currentAction?.type === 'working';
        const eitherWorking = a.state.currentAction?.type === 'working' || b.state.currentAction?.type === 'working';

        if (bothWorking && (now - (lastEncounterCheck[pairKey + ':work'] ?? 0)) < 45000) continue;

        const avgSociability = (a.state.sociability + b.state.sociability) / 2;
        const relA = a.state.relationshipMap[b.profile.id] ?? 0;

        let interactChance = avgSociability / 120;
        if (sameLocation) interactChance += 0.25;
        if (relA > 20) interactChance += 0.15;
        if (relA < -20) interactChance -= 0.1;
        if (bothWorking) interactChance *= 0.15;
        else if (eitherWorking) interactChance *= 0.4;
        interactChance = Math.max(0.02, Math.min(0.85, interactChance));

        if (Math.random() < interactChance) {
          if (bothWorking) lastEncounterCheck[pairKey + ':work'] = now;

          if (eitherWorking) {
            startWorkChat(a, b);
          } else {
            startConversation(a, b);
          }

          store.pushEvent({
            id: `evt_${now}_social_${Math.random().toString(36).slice(2, 8)}`,
            event: {
              type: 'SOCIAL_INVITE',
              fromId: a.profile.id,
              toId: b.profile.id,
              timestamp: now,
            },
            gameTime: store.world.time,
            realTimestamp: now,
          });

          store.updateVillager(a.profile.id, { sociability: Math.max(0, a.state.sociability - 20) });
          store.updateVillager(b.profile.id, { sociability: Math.max(0, b.state.sociability - 20) });
        }
      }
    }
  }
}

const locationPositions: Record<string, Array<{ x: number; y: number }>> = {
  [AREA_TAGS.TOWN_SQUARE]: [
    { x: 18, y: 13 }, { x: 19, y: 13 }, { x: 20, y: 13 }, { x: 21, y: 13 },
    { x: 18, y: 14 }, { x: 19, y: 14 }, { x: 20, y: 14 }, { x: 21, y: 14 },
  ],
  [AREA_TAGS.CAFE]: [{ x: 14, y: 19 }, { x: 15, y: 19 }, { x: 16, y: 19 }],
  [AREA_TAGS.STORE]: [{ x: 27, y: 13 }, { x: 28, y: 13 }, { x: 29, y: 13 }],
  [AREA_TAGS.GARDEN]: [{ x: 7, y: 13 }, { x: 8, y: 13 }, { x: 9, y: 13 }],
  [AREA_TAGS.LAKE]: [{ x: 18, y: 24 }, { x: 19, y: 24 }, { x: 20, y: 24 }, { x: 21, y: 24 }, { x: 22, y: 24 }],
  [AREA_TAGS.WORKSHOP]: [{ x: 27, y: 4 }, { x: 28, y: 4 }, { x: 29, y: 4 }],
  [AREA_TAGS.HOME_1]: [{ x: 5, y: 4 }, { x: 6, y: 4 }, { x: 7, y: 4 }],
  [AREA_TAGS.HOME_2]: [{ x: 13, y: 4 }, { x: 14, y: 4 }, { x: 15, y: 4 }],
  [AREA_TAGS.HOME_3]: [{ x: 5, y: 19 }, { x: 6, y: 19 }, { x: 7, y: 19 }],
  [AREA_TAGS.HOME_4]: [{ x: 23, y: 19 }, { x: 24, y: 19 }, { x: 25, y: 19 }],
  [AREA_TAGS.HOME_5]: [{ x: 31, y: 19 }, { x: 32, y: 19 }, { x: 33, y: 19 }],
  [AREA_TAGS.HOME_6]: [{ x: 21, y: 4 }, { x: 22, y: 4 }, { x: 23, y: 4 }],
  [AREA_TAGS.HOME_7]: [{ x: 35, y: 4 }, { x: 36, y: 4 }, { x: 37, y: 4 }],
  [AREA_TAGS.HOME_8]: [{ x: 35, y: 13 }, { x: 36, y: 13 }, { x: 37, y: 13 }],
  [AREA_TAGS.HOME_9]: [{ x: 13, y: 9 }, { x: 14, y: 9 }, { x: 15, y: 9 }],
  [AREA_TAGS.HOME_10]: [{ x: 21, y: 9 }, { x: 22, y: 9 }, { x: 23, y: 9 }],
  [AREA_TAGS.HOME_11]: [{ x: 13, y: 23 }, { x: 14, y: 23 }, { x: 15, y: 23 }],
  [AREA_TAGS.HOME_12]: [{ x: 29, y: 23 }, { x: 30, y: 23 }, { x: 31, y: 23 }],
};

function getLocationCoords(locationId: string): { x: number; y: number } | null {
  const positions = locationPositions[locationId];
  if (!positions || positions.length === 0) return null;
  return positions[Math.floor(Math.random() * positions.length)]!;
}
