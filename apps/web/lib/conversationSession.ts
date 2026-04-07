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
  private isRunning = false;
  private basePauseMs = 350;
  private workMode: boolean;
  private pendingTurnPromise: Promise<AgentThinkResult | null> | null = null;
  private pendingSpeakerId: string | null = null;

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
      const turn = this.buildTurnContext(speakerId, i);
      if (!turn) break;

      const result = await this.resolveTurnResult(turn);
      if (!result) break;

      this.prefetchNextTurn(speakers[(i + 1) % 2]!, i + 1);

      const turnComplete = await this.applyTurnResult(turn, result);
      if (!turnComplete) break;
    }
  }

  private buildTurnContext(speakerId: string, turnIndex: number): TurnContext | null {
    const agent = getAgent(speakerId);
    if (!agent) return null;

    const store = useGameStore.getState();
    const villager = store.villagers.find((v) => v.profile.id === speakerId);
    const otherId = speakerId === this.agentAId ? this.agentBId : this.agentAId;
    const other = store.villagers.find((v) => v.profile.id === otherId);
    if (!villager || !other) return null;

    const perception = agent.perceive(store.villagers, store.world, []);
    const context = this.buildTurnPromptContext(turnIndex, perception.currentLocation, other);
    const input = agent.buildThinkInput(villager, perception, context, this.history);

    return { speakerId, otherId, villager, other, agent, input };
  }

  private buildTurnPromptContext(
    turnIndex: number,
    locationLabel: string,
    other: Villager,
  ): string {
    if (this.workMode) {
      if (turnIndex === 0) {
        return `You are working alongside ${other.profile.name} (${other.profile.job}) at ${locationLabel}. Say something SHORT and work-related — a quick request, observation about the task, or brief comment about the work. One short sentence only. Do NOT start a full conversation, just a quick work exchange.`;
      }

      const lastLine = this.history[this.history.length - 1];
      return `${other.profile.name} just said while working: "${lastLine?.text ?? '...'}" — give a quick work-related reply. One short sentence. Keep working.`;
    }

    if (turnIndex === 0) {
      return `You just ran into ${other.profile.name} (${other.profile.job}) at ${locationLabel}. Start a conversation — say something only YOU would say. Be specific to this moment.`;
    }

    const lastLine = this.history[this.history.length - 1];
    let context = `You are chatting with ${other.profile.name}. They just said: "${lastLine?.text ?? '...'}" — respond naturally in your own voice.`;
    if (turnIndex >= this.maxTurns - 1) {
      context += ' Wrap up with a farewell that fits your personality.';
    }
    return context;
  }

  private async resolveTurnResult(turn: TurnContext): Promise<AgentThinkResult | null> {
    if (this.pendingTurnPromise && this.pendingSpeakerId === turn.speakerId) {
      const promise = this.pendingTurnPromise;
      this.pendingTurnPromise = null;
      this.pendingSpeakerId = null;
      const prefetched = await promise;
      if (prefetched) {
        return prefetched;
      }
    }

    return this.requestTurn(turn.input);
  }

  private prefetchNextTurn(nextSpeakerId: string, nextTurnIndex: number): void {
    if (!this.isRunning) return;
    if (nextTurnIndex >= this.maxTurns) return;
    if (this.pendingTurnPromise || this.pendingSpeakerId) return;

    const nextTurn = this.buildTurnContext(nextSpeakerId, nextTurnIndex);
    if (!nextTurn) return;

    this.pendingSpeakerId = nextSpeakerId;
    this.pendingTurnPromise = this.requestTurn(nextTurn.input)
      .catch(() => null)
      .finally(() => {
        if (this.pendingSpeakerId !== nextSpeakerId) return;
      });
  }

  private async requestTurn(input: AgentThinkInput): Promise<AgentThinkResult | null> {
    try {
      return await callRemoteLLM(input);
    } catch {
      return null;
    }
  }

  private async applyTurnResult(turn: TurnContext, result: AgentThinkResult): Promise<boolean> {
    const speech = result.speech && result.speech.length > 2 ? result.speech : null;
    let displayDuration = 0;

    if (speech) {
      displayDuration = this.showBubble(turn.speakerId, speech);
      this.history.push({ speaker: turn.villager.profile.name, text: speech });
    }

    turn.agent.reflect(result, turn.villager);
    this.rememberConversationMoment(turn, result, speech);

    if (result.action === 'end_conversation') {
      await sleep(displayDuration + this.basePauseMs);
      return false;
    }

    await sleep(displayDuration + this.basePauseMs);
    return true;
  }

  private rememberConversationMoment(
    turn: TurnContext,
    result: AgentThinkResult,
    speech: string | null,
  ): void {
    if (!result.shouldRemember || !result.memoryNote || !speech) return;

    const store = useGameStore.getState();
    const otherAgent = getAgent(turn.otherId);
    otherAgent?.episodicMemory.add({
      id: `convo_mem_${Date.now()}_${turn.other.profile.id}`,
      villagerId: turn.other.profile.id,
      type: 'episodic',
      importance: 0.7,
      summary: `${turn.villager.profile.name} said: "${speech}"`,
      relatedActorIds: [turn.speakerId],
      tags: ['conversation'],
      timestamp: Date.now(),
      gameDay: store.world.time.day,
      emotionalTone: turn.villager.state.mood,
      location: turn.villager.state.currentLocation,
    });
  }

  private showBubble(villagerId: string, text: string): number {
    const duration = this.workMode
      ? Math.max(2200, Math.min(4200, 1500 + text.length * 40))
      : Math.max(3200, Math.min(7600, 2300 + text.length * 58));
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
    this.pendingTurnPromise = null;
    this.pendingSpeakerId = null;
    this.isRunning = false;
    activeSessions.delete(this.sessionKey);
  }
}

interface TurnContext {
  speakerId: string;
  otherId: string;
  villager: Villager;
  other: Villager;
  agent: NonNullable<ReturnType<typeof getAgent>>;
  input: AgentThinkInput;
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
