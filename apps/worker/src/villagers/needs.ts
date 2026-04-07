import type { VillagerState } from '@ai-crossing/shared';
import { NEED_DECAY_RATES, NEED_RECOVERY } from '@ai-crossing/shared';

type NeedKey = 'hunger' | 'energy' | 'stress' | 'boredom' | 'sociability';

export function decayNeeds(state: VillagerState, dt: number): VillagerState {
  return {
    ...state,
    hunger: clamp(state.hunger + NEED_DECAY_RATES.hunger * dt),
    energy: clamp(state.energy - NEED_DECAY_RATES.energy * dt),
    stress: clamp(state.stress + NEED_DECAY_RATES.stress * dt),
    boredom: clamp(state.boredom + NEED_DECAY_RATES.boredom * dt),
    sociability: clamp(state.sociability + NEED_DECAY_RATES.sociability * dt),
  };
}

export function applyActionRecovery(
  state: VillagerState,
  actionType: string,
): VillagerState {
  const recovery = NEED_RECOVERY[actionType as keyof typeof NEED_RECOVERY];
  if (!recovery) return state;

  const updated = { ...state };
  for (const [key, value] of Object.entries(recovery) as Array<[NeedKey, number]>) {
    updated[key] = clamp(updated[key] + value);
  }
  return updated;
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}
