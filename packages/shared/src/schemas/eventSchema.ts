import { z } from 'zod';

export const gameEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('TIME_TICK'),
    gameTime: z.object({ day: z.number(), hour: z.number(), minute: z.number() }),
  }),
  z.object({
    type: z.literal('ENTER_AREA'),
    villagerId: z.string(),
    areaTag: z.string(),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal('START_ACTION'),
    villagerId: z.string(),
    action: z.object({
      type: z.string(),
      startedAt: z.number(),
      duration: z.number(),
      targetId: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
    }),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal('COMPLETE_ACTION'),
    villagerId: z.string(),
    action: z.object({
      type: z.string(),
      startedAt: z.number(),
      duration: z.number(),
      targetId: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
    }),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal('SEE_CHARACTER'),
    villagerId: z.string(),
    seenId: z.string(),
    area: z.string(),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal('PLAYER_TALK'),
    villagerId: z.string(),
    message: z.string(),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal('SOCIAL_INVITE'),
    fromId: z.string(),
    toId: z.string(),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal('CONFLICT_TRIGGER'),
    participants: z.array(z.string()),
    cause: z.string(),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal('MEMORY_CREATED'),
    villagerId: z.string(),
    memory: z.object({
      id: z.string(),
      villagerId: z.string(),
      type: z.enum(['structured', 'episodic', 'working']),
      importance: z.number(),
      summary: z.string(),
      relatedActorIds: z.array(z.string()),
      tags: z.array(z.string()),
      timestamp: z.number(),
      gameDay: z.number(),
    }),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal('WORLD_STATE_CHANGED'),
    changes: z.object({
      timeChanged: z.boolean().optional(),
      weatherChanged: z.string().optional(),
    }),
    timestamp: z.number(),
  }),
]);
