import type { AgentThinkInput } from '@ai-crossing/shared';

export function buildAgentThinkPrompt(input: AgentThinkInput): { system: string; user: string } {
  const { villager, perception, memories, currentPlan, availableActions, context, conversationHistory } = input;

  const needsSummary = `Hunger: ${Math.round(villager.needs.hunger)}/100, Energy: ${Math.round(villager.needs.energy)}/100, Stress: ${Math.round(villager.needs.stress)}/100, Boredom: ${Math.round(villager.needs.boredom)}/100, Social need: ${Math.round(villager.needs.sociability)}/100`;

  const nearbySection = perception.nearbyActors.length > 0
    ? perception.nearbyActors.map((a) => `  - ${a.name} (${a.job}, ${a.mood}, ${a.action}, relationship: ${a.relationship})`).join('\n')
    : '  - Nobody nearby';

  const factsSection = memories.facts.length > 0
    ? memories.facts.map((f) => `  - ${f}`).join('\n')
    : '  - No notable facts';

  const episodesSection = memories.recentEpisodes.length > 0
    ? memories.recentEpisodes.map((e) => `  - ${e}`).join('\n')
    : '  - No recent memories';

  const planSection = currentPlan.length > 0
    ? currentPlan.map((p) => `  - ${p}`).join('\n')
    : '  - No plan yet';

  const isInConversation = conversationHistory && conversationHistory.length > 0;

  const convoSection = isInConversation
    ? `\nConversation so far:\n${conversationHistory!.map((t) => `  ${t.speaker}: "${t.text}"`).join('\n')}`
    : '';

  const actionList = availableActions.join(', ');

  const conversationRules = isInConversation
    ? `You are currently in a conversation. You MUST set action to "speak" and provide your dialogue in the "speech" field. Speak in character — 1-2 short sentences. React to what was just said. You may end the conversation by setting action to "end_conversation" instead.`
    : `Choose the best next action based on your needs, personality, and situation. If you want to say something to someone nearby, use action "speak".`;

  const system = `You are ${villager.name}, a ${villager.job} living in a small village called AI Crossing.
Personality: ${villager.traits.join(', ')}
Speaking style: ${villager.speakingStyle}
Current mood: ${villager.mood}
${needsSummary}

${conversationRules}

You must respond with ONLY valid JSON in this exact format:
{
  "thought": "your brief internal reasoning (1 sentence)",
  "action": "one of: ${actionList}",
  "target": "location name or villager name (optional)",
  "speech": "what you say out loud (only if action is speak)",
  "shouldRemember": true or false,
  "memoryNote": "brief note about this moment (optional)"
}`;

  const user = `What you see right now:
- You are at ${perception.currentLocation}. It is ${perception.timeOfDay}, weather is ${perception.weather}.
- Nearby people:
${nearbySection}
- Recent events:
${perception.recentEvents.length > 0 ? perception.recentEvents.map((e) => `  - ${e}`).join('\n') : '  - Nothing notable'}

What you remember:
${factsSection}

Recent experiences:
${episodesSection}

Your plan for today:
${planSection}
${convoSection}

Current context: ${context}

What do you do next? Respond as ${villager.name} in valid JSON.`;

  return { system, user };
}
