export const NEED_MIN = 0;
export const NEED_MAX = 100;

export const NEED_DECAY_RATES = {
  hunger: 0.15,
  energy: 0.09,
  stress: 0.03,
  boredom: 0.1,
  sociability: 0.2,
} as const;

export const NEED_THRESHOLDS = {
  hunger: { urgent: 80, high: 60, low: 20 },
  energy: { urgent: 15, high: 30, low: 70 },
  stress: { urgent: 85, high: 65, low: 25 },
  boredom: { urgent: 80, high: 55, low: 20 },
  sociability: { urgent: 80, high: 50, low: 20 },
} as const;

export const NEED_RECOVERY = {
  eating: { hunger: -40, energy: 5 },
  sleeping: { energy: 60, stress: -15 },
  socializing: { sociability: -35, boredom: -20 },
  resting: { stress: -20, energy: 15 },
  working: { boredom: -10, stress: 5, hunger: 5, energy: -8 },
  wandering: { boredom: -20, stress: -5, energy: -3 },
} as const;

export type NeedType = keyof typeof NEED_DECAY_RATES;
