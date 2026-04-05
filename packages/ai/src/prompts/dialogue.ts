import type { DialogueInput, VillagerDialogueInput } from '@ai-crossing/shared';

export function buildDialoguePrompt(input: DialogueInput): { system: string; user: string } {
  const system = `You are ${input.villagerName}, a ${input.villagerProfile} in a small village.
Personality: ${input.personality}
Speaking style: ${input.speakingStyle}
You are currently at ${input.currentLocation}, feeling ${input.currentMood}.

You must respond in character. Keep your response to 1-3 sentences.
Your relationship with ${input.speakerName}: ${describeRelationship(input.relationshipWithSpeaker)}

You must respond with valid JSON in this exact format:
{
  "dialogue": "your in-character response",
  "moodChange": "new mood or null if unchanged",
  "shouldRemember": true/false,
  "emotionalReaction": "brief emotional note (optional)",
  "relationshipDelta": 0
}`;

  const memories =
    input.memories.length > 0
      ? `\nRecent memories:\n${input.memories.map((m) => `- ${m}`).join('\n')}`
      : '';

  const user = `${input.sceneContext}${memories}

${input.speakerName} approaches and says: "${input.message}"

Respond as ${input.villagerName} in valid JSON.`;

  return { system, user };
}

export function buildVillagerDialoguePrompt(
  input: VillagerDialogueInput,
): { system: string; user: string } {
  const system = `You are a narrator generating a natural conversation between two villagers in a small pixel-art village called AI Crossing.

CHARACTER A — ${input.villagerA.name}:
${input.villagerA.profile}
Current mood: ${input.villagerA.mood}

CHARACTER B — ${input.villagerB.name}:
${input.villagerB.profile}
Current mood: ${input.villagerB.mood}

Their relationship: ${describeRelationship(input.relationship)}

Rules:
- Generate exactly 4 to 6 exchanges (alternating speakers, starting with ${input.villagerA.name})
- Each line should be 1-2 short sentences max
- Characters should speak in their own distinct voice and personality
- Include greetings, a topic of conversation, and a farewell
- They might discuss: their work, the location, the weather, gossip about other villagers, their mood, recent events, or just banter
- Conversations should feel natural and occasionally funny or warm
- If their relationship is negative, the conversation should be tense or awkward
- relationshipDelta should be between -5 and +5

Respond with ONLY valid JSON in this exact format:
{
  "exchanges": [{"speaker": "Name", "text": "dialogue line"}],
  "relationshipDelta": 0,
  "memoriesForA": ["one short summary of what A would remember"],
  "memoriesForB": ["one short summary of what B would remember"]
}`;

  const sharedMems =
    input.sharedMemories.length > 0
      ? `\nRecent shared context:\n${input.sharedMemories.map((m) => `- ${m}`).join('\n')}`
      : '';

  const user = `Location: ${input.location}
Time context: ${input.context}${sharedMems}

Generate their conversation in valid JSON. Remember: 4-6 exchanges, short lines, distinct voices.`;

  return { system, user };
}

function describeRelationship(score: number): string {
  if (score >= 50) return 'close friends';
  if (score >= 20) return 'friendly';
  if (score >= 0) return 'acquaintances';
  if (score >= -20) return 'slightly tense';
  if (score >= -50) return 'unfriendly';
  return 'hostile';
}
