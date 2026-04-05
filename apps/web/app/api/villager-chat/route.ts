import { NextResponse } from 'next/server';
import { createProvider } from '@ai-crossing/ai';
import type { VillagerDialogueInput } from '@ai-crossing/shared';

const provider = createProvider(
  (process.env.AI_PROVIDER as 'ollama') || 'ollama',
  {
    baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
    timeoutMs: 20000,
  },
);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VillagerDialogueInput;

    if (!body.villagerA?.name || !body.villagerB?.name) {
      return NextResponse.json({ error: 'Both villagers required' }, { status: 400 });
    }

    const result = await provider.generateVillagerDialogue(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Villager chat API error:', error);
    return NextResponse.json({
      exchanges: [],
      relationshipDelta: 0,
      memoriesForA: [],
      memoriesForB: [],
    });
  }
}
