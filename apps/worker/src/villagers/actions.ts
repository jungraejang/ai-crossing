import type { VillagerState, VillagerAction, ActionType } from '@ai-crossing/shared';
import { ACTION_DURATIONS } from '@ai-crossing/shared';
import { applyActionRecovery } from './needs';

export function startAction(state: VillagerState, type: ActionType): VillagerState {
  const duration = (ACTION_DURATIONS[type] ?? 15) * 1000;

  return {
    ...state,
    currentAction: {
      type,
      startedAt: Date.now(),
      duration,
    },
  };
}

export function processAction(state: VillagerState, dt: number): VillagerState {
  const action = state.currentAction;
  if (!action || action.type === 'idle' || action.type === 'walking') return state;

  const elapsed = Date.now() - action.startedAt;
  if (elapsed >= action.duration) {
    const recovered = applyActionRecovery(state, action.type);
    return {
      ...recovered,
      currentAction: { type: 'idle', startedAt: Date.now(), duration: 0 },
    };
  }

  return state;
}
