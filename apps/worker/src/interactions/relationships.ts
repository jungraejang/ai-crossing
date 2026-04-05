import type { Villager } from '@ai-crossing/shared';

const RELATIONSHIP_MIN = -100;
const RELATIONSHIP_MAX = 100;

export function updateRelationship(
  villager: Villager,
  otherId: string,
  delta: number,
): void {
  const current = villager.state.relationshipMap[otherId] ?? 0;
  villager.state.relationshipMap[otherId] = clamp(
    current + delta,
    RELATIONSHIP_MIN,
    RELATIONSHIP_MAX,
  );
}

export function getRelationship(villager: Villager, otherId: string): number {
  return villager.state.relationshipMap[otherId] ?? 0;
}

export function describeRelationship(score: number): string {
  if (score >= 50) return 'close friends';
  if (score >= 20) return 'friendly';
  if (score >= 0) return 'acquaintances';
  if (score >= -20) return 'slightly tense';
  if (score >= -50) return 'unfriendly';
  return 'hostile';
}

export function dailyRelationshipDecay(villager: Villager): void {
  for (const [id, score] of Object.entries(villager.state.relationshipMap)) {
    if (score > 0) {
      villager.state.relationshipMap[id] = Math.max(0, score - 0.5);
    } else if (score < 0) {
      villager.state.relationshipMap[id] = Math.min(0, score + 0.3);
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
