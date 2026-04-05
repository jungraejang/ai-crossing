import type { AgentThinkInput } from '@ai-crossing/shared';

const CONVERSATION_TOPICS = [
  'a funny dream you had last night',
  'village gossip you heard recently',
  'a childhood memory',
  'something you noticed about the weather',
  'a strange noise you heard earlier',
  'a recipe or food you want to try',
  'a favorite spot in the village and why you like it',
  'something you wish the village had',
  'an embarrassing moment from your past',
  'what you think about the season changing',
  'a compliment about the other person',
  'a worry you have been keeping to yourself',
  'an opinion about village life',
  'a rumor you are not sure is true',
  'a question about the other person\'s day',
  'a small frustration you need to vent about',
  'something beautiful you noticed today',
  'a joke or pun',
  'a philosophical thought that popped into your head',
  'something you are looking forward to',
  'a favor you need to ask',
  'a memory of something that happened at this location',
  'something you overheard someone say',
  'a talent or skill you wish you had',
  'your opinion about the best food in the village',
];

const PERSONALITY_FLAVOR: Record<string, string> = {
  cheerful: 'You see the bright side of everything. You laugh easily, use exclamation marks, and make others feel welcome. You sometimes ramble when excited.',
  talkative: 'You love to chat and hate silence. You ask follow-up questions, share stories, and sometimes overshare. You use friendly nicknames.',
  quiet: 'You speak only when you have something worth saying. Your words are few but meaningful. You use pauses (...) and short sentences. You observe more than you talk.',
  hardworking: 'You take pride in effort and craft. You relate things back to work ethic and doing things properly. You respect dedication in others.',
  witty: 'You are clever with words and love wordplay. You make observations others miss, use sarcasm gently, and enjoy teasing friends. You often smirk.',
  curious: 'You ask a lot of questions. Everything fascinates you. You connect unrelated ideas and love learning new things about people.',
  gruff: 'You are blunt and direct. You do not sugarcoat things. Under the tough exterior, you care deeply but show it through actions not words. You grunt and sigh.',
  loyal: 'You stand by your friends no matter what. You remember favors and hold grudges. You speak honestly to people you trust.',
  gentle: 'You speak softly and choose kind words. You notice when others are upset. You use nature metaphors and speak with calm wisdom.',
  mystical: 'You sense things others do not. You speak in metaphors about cycles, seasons, and energy. You sometimes say cryptic things that turn out to be true.',
  playful: 'You turn everything into a game or joke. You are physical and expressive — you mime, gesture, and make sound effects. You hate being bored.',
  dramatic: 'Everything is a big deal to you. You exaggerate for effect, use theatrical language, and treat daily life like a stage performance.',
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

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

  const personalityDetails = villager.traits
    .map((t) => PERSONALITY_FLAVOR[t])
    .filter(Boolean)
    .join(' ');

  const topicSuggestion = pickRandom(CONVERSATION_TOPICS);
  const altTopic = pickRandom(CONVERSATION_TOPICS.filter((t) => t !== topicSuggestion));

  let conversationRules: string;
  if (isInConversation) {
    const turnCount = conversationHistory!.length;
    let guidance = '';
    if (turnCount === 0) {
      guidance = 'This is the start of the conversation. Greet them and bring up something interesting.';
    } else if (turnCount <= 2) {
      guidance = `Build on what was said. You could talk about ${topicSuggestion}, or ${altTopic}. Be specific and personal.`;
    } else {
      guidance = 'The conversation is flowing. React naturally to what was just said. Share something personal, ask a question, make a joke, or express an emotion. Keep it real.';
    }

    conversationRules = `You are in a conversation. You MUST set action to "speak" and provide dialogue in "speech".
${guidance}

DIALOGUE RULES:
- MAXIMUM 2 sentences. Keep it SHORT. Under 120 characters if possible.
- DO NOT write long paragraphs or monologues
- Speak in YOUR unique voice — short and punchy
- DO NOT be generic. No "How are you?" or "Nice weather" unless that genuinely fits your character
- Reference specific things: the location, something you did today, the other person
- Show emotion through brief reactions: laugh, sigh, hesitate, tease
- You may end the conversation with action "end_conversation" if it feels natural`;
  } else {
    conversationRules = `Choose the best next action based on your needs, personality, and situation. If you want to say something to someone nearby, use action "speak".`;
  }

  const system = `You are ${villager.name}, a ${villager.job} living in a small village called AI Crossing.

PERSONALITY: ${villager.traits.join(', ')}
${personalityDetails}

SPEAKING STYLE: ${villager.speakingStyle}
Current mood: ${villager.mood}
${needsSummary}

${conversationRules}

Respond with ONLY valid JSON:
{
  "thought": "your brief internal reasoning (1 sentence)",
  "action": "one of: ${actionList}",
  "target": "location name or villager name (optional)",
  "speech": "what you say out loud — MAX 2 sentences, under 120 chars (only if speaking)",
  "shouldRemember": true or false,
  "memoryNote": "brief note about this moment (optional)"
}`;

  const user = `CURRENT SCENE:
- Location: ${perception.currentLocation}. Time: ${perception.timeOfDay}. Weather: ${perception.weather}.
- Nearby: 
${nearbySection}
- Recent events:
${perception.recentEvents.length > 0 ? perception.recentEvents.map((e) => `  - ${e}`).join('\n') : '  - Nothing notable'}

YOUR MEMORIES:
${factsSection}
${episodesSection}

TODAY'S PLAN:
${planSection}
${convoSection}

${context}

Respond as ${villager.name} in valid JSON. Make your speech distinctive and personal to who you are.`;

  return { system, user };
}
