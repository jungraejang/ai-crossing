import type { Villager, AgentThinkInput, AgentThinkResult, WorldState } from '@ai-crossing/shared';
import { AREA_TAGS, getTimeOfDay, NEED_THRESHOLDS } from '@ai-crossing/shared';
import { StructuredMemoryStore, EpisodicMemoryStore } from '@ai-crossing/ai';
import type { StructuredMemory, EpisodicMemory } from '@ai-crossing/shared';
import { useGameStore } from '@/stores/gameStore';

const LOCATION_LABELS: Record<string, string> = {
  [AREA_TAGS.TOWN_SQUARE]: 'Town Square',
  [AREA_TAGS.CAFE]: 'Café',
  [AREA_TAGS.STORE]: 'General Store',
  [AREA_TAGS.GARDEN]: 'Garden',
  [AREA_TAGS.LAKE]: 'Lake',
  [AREA_TAGS.WORKSHOP]: 'Workshop',
  [AREA_TAGS.HOME_1]: "Maple's Home",
  [AREA_TAGS.HOME_2]: "Jasper & Ivy's Home",
  [AREA_TAGS.HOME_3]: "Luna & Felix's Home",
  [AREA_TAGS.HOME_4]: "Rowan & Pearl's Home",
  [AREA_TAGS.HOME_5]: "Sage & Otto's Home",
  [AREA_TAGS.HOME_6]: "Coral's Home",
  [AREA_TAGS.HOME_7]: "Finn's Home",
  [AREA_TAGS.HOME_8]: "Milo's Home",
};

const AVAILABLE_ACTIONS = [
  'move_to', 'eat', 'work', 'socialize', 'rest', 'wander', 'sleep', 'speak', 'idle', 'end_conversation',
];

const AVAILABLE_LOCATIONS = [
  'Town Square', 'Café', 'General Store', 'Garden', 'Lake', 'Workshop',
];

export interface AgentPerception {
  nearbyActors: Array<{
    name: string;
    job: string;
    mood: string;
    action: string;
    relationship: number;
  }>;
  currentLocation: string;
  timeOfDay: string;
  weather: string;
  recentEvents: string[];
}

export interface AgentDebugInfo {
  lastThought: string;
  lastAction: string;
  lastTarget: string;
  thinkCount: number;
  memoryFactCount: number;
  memoryEpisodeCount: number;
  isThinking: boolean;
  currentIntention: string;
  planItems: string[];
}

export class VillagerAgent {
  readonly villagerId: string;
  private villagerName: string;

  readonly structuredMemory: StructuredMemoryStore;
  readonly episodicMemory: EpisodicMemoryStore;

  private lastThinkGameMinute = -1;
  private thinkCooldownGameMinutes = 60;
  private isThinking = false;
  private currentIntention: string = '';
  private planItems: string[] = [];
  private lastThought = '';
  private lastAction = '';
  private lastTarget = '';
  private thinkCount = 0;

  inConversation = false;
  conversationPartnerId: string | null = null;

  constructor(villagerId: string, villagerName: string) {
    this.villagerId = villagerId;
    this.villagerName = villagerName;
    this.structuredMemory = new StructuredMemoryStore();
    this.episodicMemory = new EpisodicMemoryStore(50);
  }

  perceive(allVillagers: Villager[], world: WorldState, recentEventDescriptions: string[]): AgentPerception {
    const self = allVillagers.find((v) => v.profile.id === this.villagerId);
    if (!self) {
      return { nearbyActors: [], currentLocation: 'unknown', timeOfDay: 'day', weather: world.weather, recentEvents: [] };
    }

    const nearby = allVillagers.filter((v) => {
      if (v.profile.id === this.villagerId) return false;
      const dx = v.state.x - self.state.x;
      const dy = v.state.y - self.state.y;
      return Math.sqrt(dx * dx + dy * dy) < 5;
    });

    return {
      nearbyActors: nearby.map((v) => ({
        name: v.profile.name,
        job: v.profile.job,
        mood: v.state.mood,
        action: v.state.currentAction?.type ?? 'idle',
        relationship: self.state.relationshipMap[v.profile.id] ?? 0,
      })),
      currentLocation: LOCATION_LABELS[self.state.currentLocation] ?? self.state.currentLocation,
      timeOfDay: getTimeOfDay(world.time.hour),
      weather: world.weather,
      recentEvents: recentEventDescriptions.slice(-5),
    };
  }

  shouldThink(villager: Villager, totalGameMinutes: number): boolean {
    if (this.isThinking) return false;
    if (this.inConversation) return false;

    const actionType = villager.state.currentAction?.type;
    if (actionType === 'idle' || !actionType) {
      if (totalGameMinutes - this.lastThinkGameMinute >= this.thinkCooldownGameMinutes) {
        return true;
      }
    }

    if (villager.state.hunger >= NEED_THRESHOLDS.hunger.urgent && this.lastAction !== 'eat') return true;
    if (villager.state.energy <= NEED_THRESHOLDS.energy.urgent && this.lastAction !== 'sleep') return true;

    if (totalGameMinutes - this.lastThinkGameMinute >= this.thinkCooldownGameMinutes * 3) {
      return true;
    }

    return false;
  }

  buildThinkInput(villager: Villager, perception: AgentPerception, context: string, conversationHistory?: Array<{ speaker: string; text: string }>): AgentThinkInput {
    const facts = this.structuredMemory.getTopFacts(this.villagerId, 8);
    const episodes = this.episodicMemory.getRecentSummaries(this.villagerId, 5);

    return {
      villager: {
        name: villager.profile.name,
        job: villager.profile.job,
        traits: villager.profile.traits,
        speakingStyle: villager.profile.speakingStyle,
        mood: villager.state.mood,
        needs: {
          hunger: villager.state.hunger,
          energy: villager.state.energy,
          stress: villager.state.stress,
          boredom: villager.state.boredom,
          sociability: villager.state.sociability,
        },
      },
      perception,
      memories: { facts, recentEpisodes: episodes },
      currentPlan: this.planItems,
      availableActions: AVAILABLE_ACTIONS,
      context,
      conversationHistory,
    };
  }

  async think(villager: Villager, perception: AgentPerception, totalGameMinutes: number, context: string): Promise<AgentThinkResult | null> {
    this.isThinking = true;
    this.lastThinkGameMinute = totalGameMinutes;

    try {
      const input = this.buildThinkInput(villager, perception, context);
      const result = await thinkQueue.enqueue(this.villagerId, 5, input);

      this.lastThought = result.thought;
      this.lastAction = result.action;
      this.lastTarget = result.target ?? '';
      this.thinkCount++;
      this.currentIntention = `${result.action}${result.target ? ' → ' + result.target : ''}`;

      if (result.action === 'move_to' && result.target) {
        const firstPlanMatch = this.planItems.findIndex((p) =>
          p.toLowerCase().includes(result.target!.toLowerCase()),
        );
        if (firstPlanMatch >= 0) {
          this.planItems.splice(firstPlanMatch, 1);
        }
      }

      console.log(`[Agent] ${villager.profile.name} thinks: "${result.thought}" → ${result.action} ${result.target ?? ''}`);
      return result;
    } catch (err) {
      console.warn(`[Agent] ${villager.profile.name} think failed:`, err);
      return null;
    } finally {
      this.isThinking = false;
    }
  }

  act(villager: Villager, result: AgentThinkResult): Partial<Villager['state']> | null {
    const locationMap: Record<string, string> = {
      'town square': AREA_TAGS.TOWN_SQUARE,
      'café': AREA_TAGS.CAFE,
      'cafe': AREA_TAGS.CAFE,
      'general store': AREA_TAGS.STORE,
      'store': AREA_TAGS.STORE,
      'garden': AREA_TAGS.GARDEN,
      'lake': AREA_TAGS.LAKE,
      'workshop': AREA_TAGS.WORKSHOP,
      'home': villager.profile.homeId,
    };

    switch (result.action) {
      case 'move_to': {
        const target = result.target?.toLowerCase() ?? '';
        const locationId = locationMap[target] ?? findLocationByKeyword(target, villager.profile.homeId);
        if (locationId && villager.state.currentLocation !== locationId) {
          return {
            targetDestination: locationId,
            currentAction: { type: 'idle', startedAt: Date.now(), duration: 0 },
          };
        }
        return null;
      }
      case 'eat':
        return { currentAction: { type: 'eating', startedAt: Date.now(), duration: 15, gameTimeElapsed: 0 } };
      case 'work':
        return { currentAction: { type: 'working', startedAt: Date.now(), duration: 45, gameTimeElapsed: 0 } };
      case 'rest':
        return { currentAction: { type: 'resting', startedAt: Date.now(), duration: 20, gameTimeElapsed: 0 } };
      case 'sleep':
        return {
          targetDestination: villager.profile.homeId,
          currentAction: { type: 'idle', startedAt: Date.now(), duration: 0 },
        };
      case 'wander':
        return { currentAction: { type: 'wandering', startedAt: Date.now(), duration: 15, gameTimeElapsed: 0 } };
      case 'socialize':
        return { currentAction: { type: 'socializing', startedAt: Date.now(), duration: 10, gameTimeElapsed: 0 } };
      case 'speak': {
        if (result.speech) {
          useGameStore.getState().addSpeechBubble({
            id: `agent_speak_${Date.now()}_${this.villagerId}`,
            villagerId: this.villagerId,
            text: result.speech,
            createdAt: Date.now(),
            expiresAt: Date.now() + Math.max(2500, Math.min(5000, 1500 + result.speech.length * 40)),
          });
        }
        return null;
      }
      case 'idle':
        return { currentAction: { type: 'idle', startedAt: Date.now(), duration: 0 } };
      default:
        return null;
    }
  }

  reflect(result: AgentThinkResult, villager: Villager): void {
    if (!result.shouldRemember || !result.memoryNote) return;

    const now = Date.now();
    const store = useGameStore.getState();
    const day = store.world.time.day;

    this.episodicMemory.add({
      id: `ep_${now}_${this.villagerId}`,
      villagerId: this.villagerId,
      type: 'episodic',
      importance: 0.6,
      summary: result.memoryNote,
      relatedActorIds: [],
      tags: [result.action],
      timestamp: now,
      gameDay: day,
      emotionalTone: villager.state.mood,
      location: villager.state.currentLocation,
    });
  }

  setPlan(items: string[]): void {
    this.planItems = [...items];
  }

  getDebugInfo(): AgentDebugInfo {
    return {
      lastThought: this.lastThought,
      lastAction: this.lastAction,
      lastTarget: this.lastTarget,
      thinkCount: this.thinkCount,
      memoryFactCount: this.structuredMemory.getAll(this.villagerId).length,
      memoryEpisodeCount: this.episodicMemory.getAll(this.villagerId).length,
      isThinking: this.isThinking,
      currentIntention: this.currentIntention,
      planItems: this.planItems,
    };
  }
}

function findLocationByKeyword(keyword: string, homeId: string): string {
  const lower = keyword.toLowerCase();
  if (lower.includes('café') || lower.includes('cafe') || lower.includes('coffee')) return AREA_TAGS.CAFE;
  if (lower.includes('square') || lower.includes('town') || lower.includes('center')) return AREA_TAGS.TOWN_SQUARE;
  if (lower.includes('store') || lower.includes('shop')) return AREA_TAGS.STORE;
  if (lower.includes('garden') || lower.includes('farm') || lower.includes('crop')) return AREA_TAGS.GARDEN;
  if (lower.includes('lake') || lower.includes('water') || lower.includes('fish') || lower.includes('bridge')) return AREA_TAGS.LAKE;
  if (lower.includes('workshop') || lower.includes('craft') || lower.includes('wood')) return AREA_TAGS.WORKSHOP;
  if (lower.includes('home') || lower.includes('house') || lower.includes('bed')) return homeId;
  return AREA_TAGS.TOWN_SQUARE;
}

// --- Think Queue: serializes LLM calls with priority ---

interface QueueItem {
  agentId: string;
  priority: number;
  input: AgentThinkInput;
  resolve: (result: AgentThinkResult) => void;
  reject: (error: Error) => void;
  enqueuedAt: number;
}

class AgentThinkQueue {
  private queue: QueueItem[] = [];
  private processing = false;
  private maxQueueSize = 12;

  async enqueue(agentId: string, priority: number, input: AgentThinkInput): Promise<AgentThinkResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({ agentId, priority, input, resolve, reject, enqueuedAt: Date.now() });
      this.queue.sort((a, b) => b.priority - a.priority);

      if (this.queue.length > this.maxQueueSize) {
        const dropped = this.queue.pop()!;
        dropped.reject(new Error('Queue overflow — dropped'));
      }

      this.processNext();
    });
  }

  setPriority(agentId: string, newPriority: number): void {
    for (const item of this.queue) {
      if (item.agentId === agentId) {
        item.priority = newPriority;
      }
    }
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  private async processNext(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    const item = this.queue.shift()!;

    try {
      const res = await fetch('/api/agent-think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.input),
      });

      if (!res.ok) throw new Error(`agent-think API ${res.status}`);
      const result = (await res.json()) as AgentThinkResult;
      item.resolve(result);
    } catch (err) {
      item.reject(err instanceof Error ? err : new Error(String(err)));
    } finally {
      this.processing = false;
      if (this.queue.length > 0) {
        this.processNext();
      }
    }
  }

  get depth(): number {
    return this.queue.length;
  }
}

export const thinkQueue = new AgentThinkQueue();

// --- Agent Registry ---

const agentRegistry: Map<string, VillagerAgent> = new Map();

export function createAgent(villagerId: string, villagerName: string): VillagerAgent {
  const agent = new VillagerAgent(villagerId, villagerName);
  agentRegistry.set(villagerId, agent);
  return agent;
}

export function getAgent(villagerId: string): VillagerAgent | undefined {
  return agentRegistry.get(villagerId);
}

export function getAllAgents(): VillagerAgent[] {
  return Array.from(agentRegistry.values());
}

export function clearAgents(): void {
  agentRegistry.clear();
}
