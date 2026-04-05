import { create } from 'zustand';
import type {
  Villager,
  WorldState,
  GameTime,
  SimulationSpeed,
  Weather,
  GameEvent,
  GameEventLog,
} from '@ai-crossing/shared';

export interface SpeechBubble {
  id: string;
  villagerId: string;
  text: string;
  createdAt: number;
  expiresAt: number;
}

interface GameState {
  world: WorldState;
  villagers: Villager[];
  eventLog: GameEventLog[];
  speechBubbles: SpeechBubble[];
  isInitialized: boolean;

  setWorld: (world: WorldState) => void;
  setVillagers: (villagers: Villager[]) => void;
  updateVillager: (id: string, updates: Partial<Villager['state']>) => void;
  advanceTime: (dt: number) => void;
  setSpeed: (speed: SimulationSpeed) => void;
  togglePause: () => void;
  setWeather: (weather: Weather) => void;
  pushEvent: (event: GameEventLog) => void;
  addSpeechBubble: (bubble: SpeechBubble) => void;
  clearExpiredBubbles: () => void;
  initialize: (world: WorldState, villagers: Villager[]) => void;
}

const initialWorld: WorldState = {
  time: { day: 1, hour: 6, minute: 0 },
  weather: 'clear',
  season: 'spring',
  locations: [],
  speed: 1,
  isPaused: true,
};

const MAX_EVENT_LOG = 200;

export const useGameStore = create<GameState>((set) => ({
  world: initialWorld,
  villagers: [],
  eventLog: [],
  speechBubbles: [],
  isInitialized: false,

  setWorld: (world) => set({ world }),
  setVillagers: (villagers) => set({ villagers }),

  updateVillager: (id, updates) =>
    set((s) => ({
      villagers: s.villagers.map((v) =>
        v.profile.id === id ? { ...v, state: { ...v.state, ...updates } } : v,
      ),
    })),

  advanceTime: (dt) =>
    set((s) => {
      const { time, speed } = s.world;
      const gameMinutesPerSecond = 1 * speed;
      const addedMinutes = dt * gameMinutesPerSecond;
      const prevTotalMinutes = time.hour * 60 + (time.minuteFrac ?? time.minute);
      let totalMinutes = prevTotalMinutes + addedMinutes;
      let day = time.day;

      while (totalMinutes >= 1440) {
        totalMinutes -= 1440;
        day++;
      }

      const hour = Math.floor(totalMinutes / 60);
      const minuteFrac = totalMinutes % 60;
      const minute = Math.floor(minuteFrac);

      return {
        world: { ...s.world, time: { day, hour, minute, minuteFrac } },
      };
    }),

  setSpeed: (speed) => set((s) => ({ world: { ...s.world, speed } })),

  togglePause: () => set((s) => ({ world: { ...s.world, isPaused: !s.world.isPaused } })),

  setWeather: (weather) => set((s) => ({ world: { ...s.world, weather } })),

  pushEvent: (event) =>
    set((s) => ({
      eventLog: [...s.eventLog.slice(-MAX_EVENT_LOG), event],
    })),

  addSpeechBubble: (bubble) =>
    set((s) => ({
      speechBubbles: [...s.speechBubbles.filter((b) => b.villagerId !== bubble.villagerId), bubble],
    })),

  clearExpiredBubbles: () =>
    set((s) => ({
      speechBubbles: s.speechBubbles.filter((b) => Date.now() < b.expiresAt),
    })),

  initialize: (world, villagers) => set({ world, villagers, speechBubbles: [], isInitialized: true }),
}));
