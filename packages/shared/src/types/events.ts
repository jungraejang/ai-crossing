import type { GameTime, WorldDelta } from './world';
import type { VillagerAction } from './villager';
import type { Memory } from './memory';

export type GameEvent =
  | TimeTickEvent
  | EnterAreaEvent
  | StartActionEvent
  | CompleteActionEvent
  | SeeCharacterEvent
  | PlayerTalkEvent
  | SocialInviteEvent
  | ConflictTriggerEvent
  | MemoryCreatedEvent
  | WorldStateChangedEvent;

export interface TimeTickEvent {
  type: 'TIME_TICK';
  gameTime: GameTime;
}

export interface EnterAreaEvent {
  type: 'ENTER_AREA';
  villagerId: string;
  areaTag: string;
  timestamp: number;
}

export interface StartActionEvent {
  type: 'START_ACTION';
  villagerId: string;
  action: VillagerAction;
  timestamp: number;
}

export interface CompleteActionEvent {
  type: 'COMPLETE_ACTION';
  villagerId: string;
  action: VillagerAction;
  timestamp: number;
}

export interface SeeCharacterEvent {
  type: 'SEE_CHARACTER';
  villagerId: string;
  seenId: string;
  area: string;
  timestamp: number;
}

export interface PlayerTalkEvent {
  type: 'PLAYER_TALK';
  villagerId: string;
  message: string;
  timestamp: number;
}

export interface SocialInviteEvent {
  type: 'SOCIAL_INVITE';
  fromId: string;
  toId: string;
  timestamp: number;
}

export interface ConflictTriggerEvent {
  type: 'CONFLICT_TRIGGER';
  participants: string[];
  cause: string;
  timestamp: number;
}

export interface MemoryCreatedEvent {
  type: 'MEMORY_CREATED';
  villagerId: string;
  memory: Memory;
  timestamp: number;
}

export interface WorldStateChangedEvent {
  type: 'WORLD_STATE_CHANGED';
  changes: WorldDelta;
  timestamp: number;
}

export interface GameEventLog {
  id: string;
  event: GameEvent;
  gameTime: GameTime;
  realTimestamp: number;
}
