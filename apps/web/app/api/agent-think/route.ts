import { NextResponse } from 'next/server';
import { createProvider } from '@ai-crossing/ai';
import type { AgentThinkInput } from '@ai-crossing/shared';

const provider = createProvider(
  (process.env.AI_PROVIDER as 'lmstudio') || 'lmstudio',
  {
    baseUrl: process.env.LMSTUDIO_URL || 'http://127.0.0.1:1234',
    model: process.env.LMSTUDIO_MODEL || 'default',
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
