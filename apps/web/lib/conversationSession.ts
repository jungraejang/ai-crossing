import type { Villager, WorldState, AgentThinkInput, AgentThinkResult, Direction } from '@ai-crossing/shared';
import { useGameStore } from '@/stores/gameStore';
import { getAgent } from './villagerAgent';
import { getDirectionFromDelta } from '@ai-crossing/shared';

const activeSessions: Map<string, ConversationSession> = new Map();

export class ConversationSession {
  private agentAId: string;
  private agentBId: string;
  private sessionKey: string;
  private history: Array<{ speaker: string; text: string }> = [];
  private maxTurns: number;
  private currentTurn = 0;
  private isRunning = false;
  private basePauseMs = 1500;
  private workMode: boolean;

  constructor(villagerA: Villager, villagerB: Villager, maxTurns = 5, workMode = false) {
    this.agentAId = villagerA.profile.id;
    this.agentBId = villagerB.profile.id;
    this.sessionKey = [this.agentAId, this.agentBId].sort().join(':convo:');
    this.maxTurns = workMode ? 2 : maxTurns;
    this.workMode = workMode;
  }

  async start(): Promise<void> {
    if (activeSessions.has(this.sessionKey)) return;
    activeSessions.set(this.sessionKey, this);

    const agentA = getAgent(this.agentAId);
    const agentB = getAgent(this.agentBId);
    if (!agentA || !agentB) {
      this.end();
      return;
    }

    agentA.inConversation = true;
    agentA.conversationPartnerId = this.agentBId;
    agentB.inConversation = true;
    agentB.conversationPartnerId = this.agentAId;

    this.isRunning = true;

    const store = useGameStore.getState();
    faceEachOther(store, this.agentAId, this.agentBId);
    store.addSpeechBubble({
      id: `convo_thinking_${this.agentAId}`,
      villagerId: this.agentAId,
      text: '...',
      createdAt: Date.now(),
      expiresAt: Date.now() + 12000,
    });

    try {
      await this.runTurns();
    } catch (err) {
      console.warn(`[Conversation] Session failed:`, err);
    } finally {
      this.end();
    }
  }

  private async runTurns(): Promise<void> {
    const speakers = [this.agentAId, this.agentBId];

    for (let i = 0; i < this.maxTurns; i++) {
      if (!this.isRunning) break;

      const speakerId = speakers[i % 2]!;
      const agent = getAgent(speakerId);
      if (!agent) break;

      const store = useGameStore.getState();
      const villager = store.villagers.find((v) => v.profile.id === speakerId);
      const other = store.villagers.find((v) => v.profile.id === (speakerId === this.agentAId ? this.agentBId : this.agentAId));
      if (!villager || !other) break;

      const perception = agent.perceive(store.villagers, store.world, []);

      let context: string;
      if (this.workMode) {
        if (i === 0) {
          context = `You are working alongside ${other.profile.name} (${other.profile.job}) at ${perception.currentLocation}. Say something SHORT and work-related — a quick request, observation about the task, or brief comment about the work. One short sentence only. Do NOT start a full conversation, just a quick work exchange.`;
        } else {
          const lastLine = this.history[this.history.length - 1];
          context = `${other.profile.name} just said while working: "${lastLine?.text ?? '...'}" — give a quick work-related reply. One short sentence. Keep working.`;
        }
      } else {
        if (i === 0) {
          context = `You just ran into ${other.profile.name} (${other.profile.job}) at ${perception.currentLocation}. Start a conversation — say something only YOU would say. Be specific to this moment.`;
        } else {
          const lastLine = this.history[this.history.length - 1];
          context = `You are chatting with ${other.profile.name}. They just said: "${lastLine?.text ?? '...'}" — respond naturally in your own voice.`;
          if (i >= this.maxTurns - 1) {
            context += ' Wrap up with a farewell that fits your personality.';
          }
        }
      }

      const input = agent.buildThinkInput(villager, perception, context, this.history);

      let result: AgentThinkResult;
      try {
        result = await callRemoteLLM(input);
      } catch {
        break;
      }

      if (result.action === 'end_conversation') {
        if (result.speech && result.speech.length > 2) {
          const dur = this.showBubble(speakerId, result.speech);
          this.history.push({ speaker: villager.profile.name, text: result.speech });
          await sleep(dur + this.basePauseMs);
        }
        break;
      }

      const speech = result.speech && result.speech.length > 2 ? result.speech : null;
      let displayDuration = 0;
      if (speech) {
        displayDuration = this.showBubble(speakerId, speech);
        this.history.push({ speaker: villager.profile.name, text: speech });
      }

      agent.reflect(result, villager);

      if (result.shouldRemember && result.memoryNote) {
        const otherAgent = getAgent(speakerId === this.agentAId ? this.agentBId : this.agentAId);
        otherAgent?.episodicMemory.add({
          id: `convo_mem_${Date.now()}_${other.profile.id}`,
          villagerId: other.profile.id,
          type: 'episodic',
          importance: 0.7,
          summary: `${villager.profile.name} said: "${speech}"`,
          relatedActorIds: [speakerId],
          tags: ['conversation'],
          timestamp: Date.now(),
          gameDay: store.world.time.day,
          emotionalTone: villager.state.mood,
          location: villager.state.currentLocation,
        });
      }

      await sleep(displayDuration + this.basePauseMs);
    }
  }

  private showBubble(villagerId: string, text: string): number {
    const duration = Math.max(3000, Math.min(8000, 2000 + text.length * 55));
    useGameStore.getState().addSpeechBubble({
      id: `convo_${Date.now()}_${villagerId}`,
      villagerId,
      text,
      createdAt: Date.now(),
      expiresAt: Date.now() + duration,
    });
    return duration;
  }

  private end(): void {
    const agentA = getAgent(this.agentAId);
    const agentB = getAgent(this.agentBId);
    if (agentA) {
      agentA.inConversation = false;
      agentA.conversationPartnerId = null;
    }
    if (agentB) {
      agentB.inConversation = false;
      agentB.conversationPartnerId = null;
    }
    this.isRunning = false;
    activeSessions.delete(this.sessionKey);
  }
}

export function startConversation(villagerA: Villager, villagerB: Villager, workMode = false): void {
  const key = [villagerA.profile.id, villagerB.profile.id].sort().join(':convo:');
  if (activeSessions.has(key)) return;

  const agentA = getAgent(villagerA.profile.id);
  const agentB = getAgent(villagerB.profile.id);
  if (!agentA || !agentB) return;
  if (agentA.inConversation || agentB.inConversation) return;

  const maxTurns = workMode ? 2 : 4 + Math.floor(Math.random() * 2);
  const session = new ConversationSession(villagerA, villagerB, maxTurns, workMode);
  session.start();
}

export function isInActiveConversation(villagerId: string): boolean {
  const agent = getAgent(villagerId);
  return agent?.inConversation ?? false;
}

function faceEachOther(store: ReturnType<typeof useGameStore.getState>, idA: string, idB: string): void {
  const a = store.villagers.find((v) => v.profile.id === idA);
  const b = store.villagers.find((v) => v.profile.id === idB);
  if (!a || !b) return;

  const dx = b.state.x - a.state.x;
  const dy = b.state.y - a.state.y;

  const facingA: Direction = getDirectionFromDelta(dx, dy, a.state.facing);
  const facingB: Direction = getDirectionFromDelta(-dx, -dy, b.state.facing);

  store.updateVillager(idA, { facing: facingA });
  store.updateVillager(idB, { facing: facingB });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callRemoteLLM(input: AgentThinkInput): Promise<AgentThinkResult> {
  const res = await fetch('/api/agent-converse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) throw new Error(`agent-converse API ${res.status}`);
  return (await res.json()) as AgentThinkResult;
}
