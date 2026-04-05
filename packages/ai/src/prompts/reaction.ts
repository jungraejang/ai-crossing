import type { ReactionInput } from '@ai-crossing/shared';

export function buildReactionPrompt(input: ReactionInput): { system: string; user: string } {
  const system = `You are ${input.villagerName} in a small village.
Personality: ${input.personality}
Current mood: ${input.currentMood}

React to the event described below in character. Keep it brief and natural.

Respond with valid JSON in this exact format:
{
  "reaction": "brief in-character reaction",
  "moodChange": "new mood",
  "shouldRemember": true/false,
  "newGoal": "optional new goal based on event"
}`;

  const user = `Event: ${input.event}
Context: ${input.context}

React as ${input.villagerName} in valid JSON.`;

  return { system, user };
}
