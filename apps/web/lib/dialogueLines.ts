import type { Villager } from '@ai-crossing/shared';

export type InteractionType = 'greet' | 'small_talk' | 'help' | 'ignore' | 'argue';

const GREETINGS: Record<string, string[]> = {
  cheerful: ['Hey there, sunshine!', 'Oh, hi! Great to see you!', 'What a lovely day, right?', 'You look great today!'],
  quiet: ['...hey.', 'Morning.', 'Oh. Hello.', '*nods*'],
  witty: ['Well well, look who it is!', 'Fancy meeting you here!', 'Ah, just who I wanted to see.', 'The universe has plans for us.'],
  gruff: ['Hmph. Hey.', 'You again.', "What d'you want?", 'Oh. It\'s you.'],
  gentle: ['Hello, friend.', 'How nice to cross paths.', 'Peace to you.', 'What a gentle breeze today.'],
  playful: ['Ta-da! Here I am!', 'Miss me?', 'Surprise encounter!', 'Guess who!'],
  default: ['Hi there.', 'Hey!', 'Hello.', 'Oh hi!'],
};

const GREETING_RESPONSES: Record<string, string[]> = {
  cheerful: ['Hey! So glad to see you!', 'Hi hi hi!', 'You always brighten my day!'],
  quiet: ['Hey.', '...hi.', 'Oh, hello.'],
  witty: ['Ha! I was just thinking about you.', 'What timing!', 'The one and only.'],
  gruff: ['Yeah. Hey.', 'What.', 'Alright.'],
  gentle: ['Hello, dear.', 'How lovely.', 'And to you.'],
  playful: ['There you are!', 'My favorite person!', 'The party has arrived!'],
  default: ['Hey!', 'Hi!', 'Hello!'],
};

const SMALL_TALK_OPENERS: Record<string, string[]> = {
  town_square: [
    'The square is peaceful today.',
    'I love watching everyone pass through here.',
    "Busy day in the square, isn't it?",
    'This is my favorite spot in the village.',
  ],
  cafe: [
    'The coffee smells amazing today.',
    "Have you tried today's pastry?",
    'Nothing beats a warm cup here.',
    'I could sit here all day.',
  ],
  store: [
    'Looking for anything special?',
    'The shelves are well-stocked today.',
    'I need to pick up a few things...',
    'Anything good on sale?',
  ],
  garden: [
    'The crops are coming in nicely.',
    'Can you smell the flowers?',
    "There's something calming about this place.",
    'The soil is rich this season.',
  ],
  lake: [
    'The water is so still today.',
    'I saw a fish jump earlier!',
    "It's nice by the lake, isn't it?",
    'I could listen to the water all day.',
  ],
  workshop: [
    'Careful, sawdust everywhere.',
    'Something is always being fixed here.',
    'I love the smell of fresh wood.',
    'Hard work happening in here!',
  ],
};

const SMALL_TALK_CONTINUATIONS: string[] = [
  'So what have you been up to?',
  'How has your day been?',
  'Anything exciting happen lately?',
  "What's new with you?",
  'How are things going?',
  'Tell me something good.',
  'Doing anything fun later?',
  'Have you eaten yet today?',
];

const SMALL_TALK_RESPONSES: string[] = [
  'Yeah, I know what you mean.',
  'Ha, totally.',
  'Right? I was thinking the same.',
  'Tell me about it.',
  "That's so true.",
  'I hadn\'t thought of it that way.',
  'Haha, you always say the right thing.',
  'Couldn\'t agree more.',
];

const SMALL_TALK_SHARE: Record<string, string[]> = {
  working: [
    "Busy day! Can't stop for long.",
    'Work never ends around here.',
    'Just trying to get things done.',
    'The usual grind, you know?',
  ],
  eating: [
    'Mmm, this hits the spot.',
    'I was starving!',
    'Nothing like a good meal.',
    'Food makes everything better.',
  ],
  resting: [
    'Just taking a breather...',
    'My feet are killing me.',
    'Sometimes you just need to sit.',
    'Recharging the batteries.',
  ],
  wandering: [
    'Just out for a stroll.',
    'No plans, just walking around.',
    'Sometimes wandering is the best plan.',
    'I like to explore.',
  ],
  socializing: [
    'I love a good chat!',
    "It's nice to catch up.",
    'This is my favorite part of the day.',
    'We should do this more often.',
  ],
};

const MOOD_LINES: Record<string, string[]> = {
  happy: ['Life is good today!', "I'm in such a great mood!", 'Everything feels right.', 'Can\'t stop smiling.'],
  tired: ["*yawn* Sorry, long day...", 'I could really use a nap.', 'Running on fumes here.', 'My eyes are heavy...'],
  hungry: ["My stomach won't stop growling.", 'I need food soon...', 'Is it lunchtime yet?', 'I\'d eat anything right now.'],
  stressed: ["Things have been hectic.", "I've got so much on my mind.", '*sigh* It\'s been a lot.', 'I need a break.'],
  lonely: ["I'm glad to see someone!", 'It gets quiet sometimes.', "I've been on my own all day.", 'Company is nice.'],
  sad: ['Just one of those days.', 'Feeling a bit down.', "...it's nothing. I'm fine.", 'Everything feels gray.'],
  angry: ["Don't test me today.", "I'm NOT in the mood.", 'Ugh.', 'Leave me alone.'],
  content: ['All is well.', 'No complaints today.', "Can't complain.", 'Things are good.'],
  neutral: ['Same old, same old.', 'Nothing special happening.', 'Just another day.'],
};

const FAREWELL_LINES: Record<string, string[]> = {
  cheerful: ['Well, gotta run! See you later!', 'This was fun! Bye!', 'Take care, friend!', 'Catch you later!'],
  quiet: ['...see you.', 'Bye.', 'Later.', '*waves*'],
  witty: ['Until next time!', 'Don\'t miss me too much.', 'Places to be, people to see!', 'Same time tomorrow?'],
  gruff: ['Alright, I\'m off.', 'Yeah. Later.', 'Back to it.', 'I got things to do.'],
  gentle: ['Take care of yourself.', 'May you have a peaceful day.', 'Until we meet again.', 'Be well.'],
  playful: ['Bye bye byeee!', 'Don\'t have too much fun without me!', 'See ya, wouldn\'t wanna be ya!', 'Exit stage left!'],
  default: ['See you around.', 'Bye!', 'Later!', 'Gotta go.'],
};

const HELP_LINES: string[] = [
  'Here, let me give you a hand.',
  'Need any help with that?',
  'I can help with that!',
  'No problem, happy to help.',
  'Leave it to me!',
  'Want me to carry something?',
];

const HELP_THANKS: string[] = [
  'Oh, thanks! That means a lot.',
  "You're the best!",
  'I appreciate that, really.',
  "That's so kind of you!",
  'I owe you one!',
  "You didn't have to, but thank you.",
  'What would I do without you?',
];

const HELP_FOLLOWUP: string[] = [
  'Happy to help anytime.',
  'That\'s what friends are for!',
  'No big deal, really.',
  'Just let me know if you need anything else.',
  'We look out for each other around here.',
];

const ARGUE_LINES: Record<string, string[]> = {
  gruff: ["That's ridiculous.", "You're wrong and you know it.", "I don't have time for this.", 'Unbelievable.'],
  witty: ['Oh please, spare me.', "That's rich, coming from you.", 'Sure. Whatever you say.', 'How original.'],
  cheerful: ["Let's not fight...", "I don't want to argue...", 'Can we just talk about this?', 'This makes me sad...'],
  gentle: ['That hurts to hear.', "I don't think that's fair.", '...okay.', 'Perhaps we see things differently.'],
  playful: ['Oh come ON.', "You're being dramatic!", 'Really? REALLY?', "You can't be serious."],
  quiet: ['...fine.', '*walks away*', '...', '*silence*'],
  default: ['I disagree.', "That's not right.", "Let's drop it.", 'Whatever.'],
};

const ARGUE_ESCALATION: string[] = [
  'You know what? Forget it.',
  "I can't believe you'd say that.",
  "We're done here.",
  "This isn't over.",
  "I'm walking away before I say something I regret.",
  '*frustrated sigh*',
];

const ARGUE_DEESCALATION: string[] = [
  '...look, I\'m sorry. I didn\'t mean it like that.',
  'Can we just forget about this?',
  "Maybe you have a point...",
  "I shouldn't have said that.",
  "Let's just... start over.",
  '...yeah, okay. Fair enough.',
];

const JOB_COMMENTS: Record<string, string[]> = {
  baker: ['The bread should be ready soon!', 'I tried a new recipe today.', 'Nothing like fresh-baked goods.', 'Want to try my new scone?'],
  farmer: ['The soil is good this season.', 'Hope it rains soon for the crops.', 'Early mornings are worth it.', 'The tomatoes are coming in great.'],
  shopkeeper: ['Got some new stock in today!', 'Business has been picking up.', "I've got just the thing you need.", 'There\'s a sale on herbs.'],
  carpenter: ['Fixed that chair — good as new.', 'Wood grain tells you everything.', 'Measure twice, cut once.', 'I built a new shelf yesterday.'],
  herbalist: ['The lavender is blooming beautifully.', 'I found a rare herb by the lake.', 'Nature provides if you pay attention.', 'This tea blend is very calming.'],
  musician: ['I wrote a new song last night!', '♪ la la la ♪', 'Music makes everything better.', 'I\'m working on a melody about the village.'],
};

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)] ?? '...';
}

function pickUnique(arr: string[], exclude: string[]): string {
  const available = arr.filter((s) => !exclude.includes(s));
  if (available.length === 0) return pick(arr);
  return pick(available);
}

function getTraitKey(villager: Villager): string {
  const traits = villager.profile.traits;
  for (const t of traits) {
    if (t in GREETINGS) return t;
  }
  if (traits.includes('talkative')) return 'cheerful';
  if (traits.includes('hardworking')) return 'quiet';
  if (traits.includes('curious')) return 'witty';
  if (traits.includes('loyal')) return 'gruff';
  if (traits.includes('mystical')) return 'gentle';
  if (traits.includes('dramatic')) return 'playful';
  return 'default';
}

export interface ConversationTurn {
  speaker: string;
  text: string;
  delay: number;
}

export function generateConversation(
  a: Villager,
  b: Villager,
  interactionType: InteractionType,
): ConversationTurn[] {
  switch (interactionType) {
    case 'greet':
      return generateGreetConversation(a, b);
    case 'small_talk':
      return generateSmallTalkConversation(a, b);
    case 'help':
      return generateHelpConversation(a, b);
    case 'argue':
      return generateArgueConversation(a, b);
    case 'ignore':
      return [];
  }
}

function generateGreetConversation(a: Villager, b: Villager): ConversationTurn[] {
  const traitA = getTraitKey(a);
  const traitB = getTraitKey(b);
  const turns: ConversationTurn[] = [];
  const used: string[] = [];

  const greet = pick(GREETINGS[traitA] ?? GREETINGS.default!);
  used.push(greet);
  turns.push({ speaker: a.profile.id, text: greet, delay: 0 });

  const response = pick(GREETING_RESPONSES[traitB] ?? GREETING_RESPONSES.default!);
  turns.push({ speaker: b.profile.id, text: response, delay: 1500 });

  if (Math.random() < 0.7) {
    const followup = pick(SMALL_TALK_CONTINUATIONS);
    turns.push({ speaker: a.profile.id, text: followup, delay: 3000 });

    const moodOrAction = Math.random() < 0.5
      ? pick(MOOD_LINES[b.state.mood] ?? MOOD_LINES.neutral!)
      : pick(SMALL_TALK_SHARE[b.state.currentAction?.type ?? 'socializing'] ?? ['Not much, really.']);
    turns.push({ speaker: b.profile.id, text: moodOrAction, delay: 4500 });
  }

  if (Math.random() < 0.5) {
    const farewell = pick(FAREWELL_LINES[traitA] ?? FAREWELL_LINES.default!);
    turns.push({ speaker: a.profile.id, text: farewell, delay: turns.length * 1500 });

    const farewellB = pick(FAREWELL_LINES[traitB] ?? FAREWELL_LINES.default!);
    turns.push({ speaker: b.profile.id, text: farewellB, delay: turns.length * 1500 });
  }

  return turns;
}

function generateSmallTalkConversation(a: Villager, b: Villager): ConversationTurn[] {
  const traitA = getTraitKey(a);
  const traitB = getTraitKey(b);
  const turns: ConversationTurn[] = [];

  const locLines = SMALL_TALK_OPENERS[a.state.currentLocation];
  const opener = locLines ? pick(locLines) : pick(SMALL_TALK_CONTINUATIONS);
  turns.push({ speaker: a.profile.id, text: opener, delay: 0 });

  const resp1 = pick(SMALL_TALK_RESPONSES);
  turns.push({ speaker: b.profile.id, text: resp1, delay: 1500 });

  const jobLines = JOB_COMMENTS[a.profile.job];
  if (jobLines && Math.random() < 0.5) {
    turns.push({ speaker: a.profile.id, text: pick(jobLines), delay: 3200 });
  } else {
    const moodLine = pick(MOOD_LINES[a.state.mood] ?? MOOD_LINES.neutral!);
    turns.push({ speaker: a.profile.id, text: moodLine, delay: 3200 });
  }

  const followup = pick(SMALL_TALK_CONTINUATIONS);
  turns.push({ speaker: b.profile.id, text: followup, delay: 4800 });

  const shareLine = pick(
    SMALL_TALK_SHARE[a.state.currentAction?.type ?? 'socializing'] ?? ['Oh, you know, the usual.'],
  );
  turns.push({ speaker: a.profile.id, text: shareLine, delay: 6200 });

  if (Math.random() < 0.6) {
    const bJob = JOB_COMMENTS[b.profile.job];
    if (bJob && Math.random() < 0.5) {
      turns.push({ speaker: b.profile.id, text: pick(bJob), delay: 7600 });
    } else {
      const bMood = pick(MOOD_LINES[b.state.mood] ?? MOOD_LINES.neutral!);
      turns.push({ speaker: b.profile.id, text: bMood, delay: 7600 });
    }
  }

  const farewell = pick(FAREWELL_LINES[traitA] ?? FAREWELL_LINES.default!);
  const lastDelay = (turns.length) * 1400;
  turns.push({ speaker: a.profile.id, text: farewell, delay: lastDelay });

  const farewellB = pick(FAREWELL_LINES[traitB] ?? FAREWELL_LINES.default!);
  turns.push({ speaker: b.profile.id, text: farewellB, delay: lastDelay + 1200 });

  return turns;
}

function generateHelpConversation(a: Villager, b: Villager): ConversationTurn[] {
  const traitA = getTraitKey(a);
  const traitB = getTraitKey(b);
  const turns: ConversationTurn[] = [];

  turns.push({ speaker: a.profile.id, text: pick(HELP_LINES), delay: 0 });
  turns.push({ speaker: b.profile.id, text: pick(HELP_THANKS), delay: 1500 });
  turns.push({ speaker: a.profile.id, text: pick(HELP_FOLLOWUP), delay: 3200 });

  if (Math.random() < 0.6) {
    const gratitude = pick([
      'Seriously, you\'re amazing.',
      `${a.profile.name}, you're a lifesaver.`,
      'I\'ll return the favor someday!',
      'This village is lucky to have you.',
    ]);
    turns.push({ speaker: b.profile.id, text: gratitude, delay: 4800 });

    const farewell = pick(FAREWELL_LINES[traitA] ?? FAREWELL_LINES.default!);
    turns.push({ speaker: a.profile.id, text: farewell, delay: 6200 });
  }

  return turns;
}

function generateArgueConversation(a: Villager, b: Villager): ConversationTurn[] {
  const traitA = getTraitKey(a);
  const traitB = getTraitKey(b);
  const turns: ConversationTurn[] = [];

  turns.push({ speaker: a.profile.id, text: pick(ARGUE_LINES[traitA] ?? ARGUE_LINES.default!), delay: 0 });
  turns.push({ speaker: b.profile.id, text: pick(ARGUE_LINES[traitB] ?? ARGUE_LINES.default!), delay: 1200 });
  turns.push({ speaker: a.profile.id, text: pick(ARGUE_ESCALATION), delay: 2500 });

  if (Math.random() < 0.5) {
    turns.push({ speaker: b.profile.id, text: pick(ARGUE_DEESCALATION), delay: 4000 });
    turns.push({ speaker: a.profile.id, text: '...fine.', delay: 5500 });
  } else {
    turns.push({ speaker: b.profile.id, text: pick(ARGUE_ESCALATION), delay: 4000 });
    turns.push({ speaker: a.profile.id, text: '*walks away*', delay: 5500 });
  }

  return turns;
}
