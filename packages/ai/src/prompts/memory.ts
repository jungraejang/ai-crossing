import type { MemorySumInput } from '@ai-crossing/shared';

export function buildMemoryPrompt(input: MemorySumInput): { system: string; user: string } {
  const system = `You are summarizing ${input.villagerName}'s day in a small village.
Personality: ${input.personality}

Compress today's events into 3-5 key memory entries. Rate importance from 0.0 to 1.0.
Focus on emotionally significant, socially relevant, or novel events.

Respond with valid JSON in this exact format:
{
  "summaries": [
    {"summary": "brief memory", "importance": 0.7, "tags": ["social", "positive"]}
  ]
}`;

  const user = `Today's events for ${input.villagerName}:
${input.memories.map((m) => `- ${m}`).join('\n')}

Summarize into key memories in valid JSON.`;

  return { system, user };
}
