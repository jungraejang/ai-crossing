import type { PlanInput } from '@ai-crossing/shared';

export function buildPlanPrompt(input: PlanInput): { system: string; user: string } {
  const system = `You are ${input.villagerName} planning your day in a small village.
Personality: ${input.personality}
Weather: ${input.weather}

Create a brief plan for today. Include 3-5 intentions and note anyone you want to avoid.

Respond with valid JSON in this exact format:
{
  "intentions": ["intention 1", "intention 2", ...],
  "priority": "main focus for the day",
  "avoidances": ["person or thing to avoid"]
}`;

  const relationships = Object.entries(input.relationships)
    .map(([name, score]) => `${name}: ${score}`)
    .join(', ');

  const memories =
    input.yesterdayMemories.length > 0
      ? `Yesterday's memories:\n${input.yesterdayMemories.map((m) => `- ${m}`).join('\n')}`
      : 'No notable memories from yesterday.';

  const locations = input.availableLocations.join(', ');

  const user = `Current goals: ${input.currentGoals.join(', ') || 'none'}
Relationships: ${relationships || 'none established'}
${memories}
Available locations: ${locations}

Plan your day as ${input.villagerName} in valid JSON.`;

  return { system, user };
}
