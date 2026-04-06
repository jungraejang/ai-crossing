import { NextResponse } from 'next/server';
import { createProvider } from '@ai-crossing/ai';
import type { VillagerDialogueInput } from '@ai-crossing/shared';

const provider = createProvider(
  (process.env.AI_PROVIDER as 'lmstudio') || 'lmstudio',
  {
    baseUrl: process.env.LMSTUDIO_URL || 'http://127.0.0.1:1234',
    model: process.env.LMSTUDIO_MODEL || 'default',
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
