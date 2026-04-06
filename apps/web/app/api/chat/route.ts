import { NextResponse } from 'next/server';
import { createProvider } from '@ai-crossing/ai';
import type { DialogueInput } from '@ai-crossing/shared';

const provider = createProvider(
  (process.env.AI_PROVIDER as 'lmstudio') || 'lmstudio',
  {
    baseUrl: process.env.LMSTUDIO_URL || 'http://127.0.0.1:1234',
    model: process.env.LMSTUDIO_MODEL || 'default',
  },
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { villagerId, message, villagerContext } = body as {
      villagerId: string;
      message: string;
      villagerContext?: Partial<DialogueInput>;
    };

    if (!villagerId || !message) {
      return NextResponse.json({ error: 'villagerId and message required' }, { status: 400 });
    }

    const input: DialogueInput = {
      villagerName: villagerContext?.villagerName ?? villagerId,
      villagerProfile: villagerContext?.villagerProfile ?? 'a villager',
      personality: villagerContext?.personality ?? 'friendly',
      speakingStyle: villagerContext?.speakingStyle ?? 'casual',
      currentMood: villagerContext?.currentMood ?? 'neutral',
      currentLocation: villagerContext?.currentLocation ?? 'town square',
      memories: villagerContext?.memories ?? [],
      relationshipWithSpeaker: villagerContext?.relationshipWithSpeaker ?? 0,
      speakerName: 'Player',
      message,
      sceneContext: villagerContext?.sceneContext ?? 'The player approaches the villager.',
    };

    const result = await provider.generateDialogue(input);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Chat API error:', error);
    const fallbackDialogue =
      "I'm not sure what to say right now... *looks around awkwardly*";
    return NextResponse.json({
      dialogue: fallbackDialogue,
      moodChange: null,
      shouldRemember: false,
    });
  }
}
