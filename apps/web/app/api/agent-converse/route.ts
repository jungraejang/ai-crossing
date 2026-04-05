import { NextResponse } from 'next/server';
import type { AgentThinkInput, AgentThinkResult } from '@ai-crossing/shared';
import { buildAgentThinkPrompt } from '@ai-crossing/ai';
import { agentThinkResultSchema } from '@ai-crossing/shared';

const REMOTE_URL = process.env.REMOTE_LLM_URL || 'http://192.168.0.108:1234';
const REMOTE_MODEL = process.env.REMOTE_LLM_MODEL || 'dolphin3.0-llama3.1-8b';
const MAX_RETRIES = 3;

async function callLLM(system: string, user: string, signal: AbortSignal): Promise<AgentThinkResult> {
  const response = await fetch(`${REMOTE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: REMOTE_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.85,
      max_tokens: 1024,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`LM Studio error: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>;
  };

  let raw = data.choices?.[0]?.message?.content ?? '';

  if (!raw || raw.trim().length < 5) {
    const reasoning = data.choices?.[0]?.message?.reasoning_content;
    if (reasoning) {
      const reasoningJson = reasoning.match(/\{[\s\S]*\}/);
      if (reasoningJson) raw = reasoningJson[0];
    }
  }

  if (!raw || raw.trim().length < 5) {
    throw new Error('Empty response from model');
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) raw = jsonMatch[0];
  const parsed: unknown = JSON.parse(raw);
  return agentThinkResultSchema.parse(parsed);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AgentThinkInput;

    if (!body.villager?.name) {
      return NextResponse.json({ error: 'villager.name required' }, { status: 400 });
    }

    const { system, user } = buildAgentThinkPrompt(body);
    const systemFinal = system + '\n\nIMPORTANT: Respond with ONLY valid JSON. No markdown, no explanation. /no_think';
    const userFinal = user + '\n\nRespond with ONLY the JSON object. /no_think';

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      try {
        const result = await callLLM(systemFinal, userFinal, controller.signal);
        clearTimeout(timeout);

        if (!result.speech || result.speech.trim().length < 2) {
          lastError = new Error('Empty speech');
          continue;
        }

        if (result.speech.length > 150) {
          const sentences = result.speech.match(/[^.!?]+[.!?]+/g);
          if (sentences && sentences.length > 2) {
            result.speech = sentences.slice(0, 2).join('').trim();
          } else {
            result.speech = result.speech.slice(0, 150).trim();
          }
        }

        return NextResponse.json(result);
      } catch (err) {
        clearTimeout(timeout);
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`[agent-converse] Attempt ${attempt + 1} failed: ${lastError.message.slice(0, 80)}`);
      }
    }

    console.error(`[agent-converse] All ${MAX_RETRIES} retries failed`);
    return NextResponse.json({
      thought: 'Hmm...',
      action: 'end_conversation',
      shouldRemember: false,
    });
  } catch (error) {
    console.error(`[agent-converse] Fatal error:`, (error as Error).message?.slice(0, 100));
    return NextResponse.json({
      thought: 'Something went wrong.',
      action: 'end_conversation',
      shouldRemember: false,
    });
  }
}
