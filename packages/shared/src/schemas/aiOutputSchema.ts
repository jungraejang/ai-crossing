import { z } from 'zod';

export const dialogueResultSchema = z.object({
  dialogue: z.string(),
  moodChange: z.string().nullable(),
  shouldRemember: z.boolean(),
  emotionalReaction: z.string().optional(),
  relationshipDelta: z.number().optional(),
});

export const villagerDialogueResultSchema = z.object({
  exchanges: z.array(
    z.object({
      speaker: z.string(),
      text: z.string(),
    }),
  ),
  relationshipDelta: z.number(),
  memoriesForA: z.array(z.string()),
  memoriesForB: z.array(z.string()),
});

export const reactionResultSchema = z.object({
  reaction: z.string(),
  moodChange: z.string(),
  shouldRemember: z.boolean(),
  newGoal: z.string().optional(),
});

export const planResultSchema = z.object({
  intentions: z.array(z.string()),
  priority: z.string(),
  avoidances: z.array(z.string()),
});

export const memorySumResultSchema = z.object({
  summaries: z.array(
    z.object({
      summary: z.string(),
      importance: z.number(),
      tags: z.array(z.string()),
    }),
  ),
});

export const agentThinkResultSchema = z.object({
  thought: z.string(),
  action: z.string(),
  target: z.string().optional(),
  speech: z.string().optional(),
  shouldRemember: z.boolean().optional(),
  memoryNote: z.string().optional(),
});
