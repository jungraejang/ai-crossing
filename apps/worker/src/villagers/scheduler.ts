import type { Villager, ScheduleBlock, ActionType, GameTime } from '@ai-crossing/shared';

export function getCurrentScheduleBlock(
  villager: Villager,
  gameTime: GameTime,
): ScheduleBlock | null {
  const { dailySchedule } = villager.profile;
  const hour = gameTime.hour;

  for (const block of dailySchedule) {
    if (block.startHour <= block.endHour) {
      if (hour >= block.startHour && hour < block.endHour) return block;
    } else {
      if (hour >= block.startHour || hour < block.endHour) return block;
    }
  }

  return null;
}

export function shouldFollowSchedule(villager: Villager, gameTime: GameTime): boolean {
  const block = getCurrentScheduleBlock(villager, gameTime);
  if (!block) return false;

  const { state } = villager;
  if (state.hunger >= 80) return false;
  if (state.energy <= 15) return false;

  return true;
}

export function getScheduledAction(
  villager: Villager,
  gameTime: GameTime,
): { action: ActionType; locationId: string } | null {
  const block = getCurrentScheduleBlock(villager, gameTime);
  if (!block) return null;

  return {
    action: block.action as ActionType,
    locationId: block.locationId || villager.profile.homeId,
  };
}
