export const NEED_MIN = 0;
export const NEED_MAX = 100;

export const NEED_DECAY_RATES = {
  hunger: 0.15,
  energy: 0.1,
  stress: 0.02,
  boredom: 0.08,
  sociability: 0.05,
} as const;

export const NEED_THRESHOLDS = {
  hunger: { urgent: 80, high: 60, low: 20 },
  energy: { urgent: 15, high: 30, low: 70 },
  stress: { urgent: 85, high: 65, low: 25 },
  boredom: { urgent: 85, high: 65, low: 25 },
  sociability: { urgent: 85, high: 65, low: 25 },
} as const;

export const NEED_RECOVERY = {
  eating: { hunger: -40, energy: 5 },
  sleeping: { energy: 50, stress: -10 },
  socializing: { sociability: -30, boredom: -15 },
  resting: { stress: -20, energy: 10 },
  working: { boredom: -10, stress: 5, hunger: 5, energy: -5 },
  wandering: { boredom: -20, stress: -5 },
} as const;

export type NeedType = keyof typeof NEED_DECAY_RATES;
