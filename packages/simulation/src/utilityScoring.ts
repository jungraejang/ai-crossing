import type { VillagerState, ActionType } from '@ai-crossing/shared';
import { NEED_THRESHOLDS } from '@ai-crossing/shared';

export interface UtilityScores {
  eat: number;
  sleep: number;
  work: number;
  socialize: number;
  wander: number;
  rest: number;
}

export function calculateUtilityScores(
  state: VillagerState,
  isScheduledWork: boolean,
): UtilityScores {
  return {
    eat: state.hunger * 1.5,
    sleep: (100 - state.energy) * 1.2,
    work: isScheduledWork ? 60 : 20,
    socialize: state.sociability * 0.8,
    wander: state.boredom * 0.5,
    rest: state.stress * 0.6,
  };
}

export function pickBestAction(
  state: VillagerState,
  isScheduledWork: boolean,
): ActionType {
  if (state.hunger >= NEED_THRESHOLDS.hunger.urgent) return 'eating';
  if (state.energy <= NEED_THRESHOLDS.energy.urgent) return 'sleeping';

  const scores = calculateUtilityScores(state, isScheduledWork);
  const entries = Object.entries(scores) as Array<[string, number]>;
  entries.sort((a, b) => b[1] - a[1]);

  const actionMap: Record<string, ActionType> = {
    eat: 'eating',
    sleep: 'sleeping',
    work: 'working',
    socialize: 'socializing',
    wander: 'wandering',
    rest: 'resting',
  };

  const best = entries[0]!;
  return actionMap[best[0]] ?? 'idle';
}
