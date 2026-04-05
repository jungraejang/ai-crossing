import { NextResponse } from 'next/server';
import { createProvider } from '@ai-crossing/ai';
import type { PlanInput } from '@ai-crossing/shared';

const provider = createProvider(
  (process.env.AI_PROVIDER as 'ollama') || 'ollama',
  {
    baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
  },
);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PlanInput;

    if (!body.villagerName) {
      return NextResponse.json({ error: 'villagerName required' }, { status: 400 });
    }

    const result = await provider.generatePlan(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Plan API error:', error);
    return NextResponse.json({
      intentions: ['Go to work', 'Have lunch', 'Relax in the evening'],
      priority: 'Have a normal day',
      avoidances: [],
    });
  }
}
