import { NextResponse } from 'next/server';
import { createProvider } from '@ai-crossing/ai';
import type { AgentThinkInput } from '@ai-crossing/shared';

const provider = createProvider(
  (process.env.AI_PROVIDER as 'ollama') || 'ollama',
  {
    baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
    timeoutMs: 15000,
    maxRetries: 1,
  },
);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AgentThinkInput;

    if (!body.villager?.name) {
      return NextResponse.json({ error: 'villager.name required' }, { status: 400 });
    }

    const result = await provider.agentThink(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[agent-think] Error for ${(error as Error).message?.slice(0, 100)}`);
    return NextResponse.json({
      thought: 'I should just keep doing what I was doing.',
      action: 'idle',
      shouldRemember: false,
    });
  }
}
