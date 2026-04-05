export interface VillagerProfile {
  id: string;
  name: string;
  ageBand: 'young' | 'adult' | 'elder';
  job: VillagerJob;
  traits: string[];
  likes: string[];
  dislikes: string[];
  homeId: string;
  speakingStyle: string;
  dailySchedule: ScheduleBlock[];
}

export interface VillagerState {
  currentLocation: string;
  targetDestination: string | null;
  currentAction: VillagerAction | null;
  hunger: number;
  energy: number;
  stress: number;
  boredom: number;
  sociability: number;
  mood: Mood;
  inventory: Item[];
  relationshipMap: Record<string, number>;
  shortTermGoals: string[];
  currentPlan: string[];
  conversationContext: string | null;
  x: number;
  y: number;
  facing: Direction;
  isMoving: boolean;
  path: Array<{ x: number; y: number }>;
}

export interface Villager {
  profile: VillagerProfile;
  state: VillagerState;
}

export type VillagerJob =
  | 'baker'
  | 'farmer'
  | 'shopkeeper'
  | 'carpenter'
  | 'herbalist'
  | 'musician';

export type Mood =
  | 'happy'
  | 'content'
  | 'neutral'
  | 'tired'
  | 'hungry'
  | 'stressed'
  | 'sad'
  | 'angry'
  | 'excited'
  | 'lonely';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface VillagerAction {
  type: ActionType;
  startedAt: number;
  duration: number;
  gameTimeElapsed?: number;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

export type ActionType =
  | 'idle'
  | 'walking'
  | 'working'
  | 'eating'
  | 'sleeping'
  | 'socializing'
  | 'resting'
  | 'wandering'
  | 'shopping'
  | 'crafting';

export interface ScheduleBlock {
  startHour: number;
  endHour: number;
  action: ActionType;
  locationId: string;
}

export interface Item {
  id: string;
  type: ItemType;
  quantity: number;
  owner: string;
}

export type ItemType =
  | 'bread'
  | 'coffee'
  | 'vegetables'
  | 'herbs'
  | 'wood'
  | 'tools'
  | 'fish'
  | 'flowers';
