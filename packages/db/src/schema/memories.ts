import { pgTable, text, real, integer, jsonb } from 'drizzle-orm/pg-core';

export const memoriesTable = pgTable('memories', {
  id: text('id').primaryKey(),
  villagerId: text('villager_id').notNull(),
  type: text('type').notNull(),
  importance: real('importance').notNull().default(0.5),
  summary: text('summary').notNull(),
  relatedActorIds: jsonb('related_actor_ids').$type<string[]>().notNull().default([]),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  gameDay: integer('game_day').notNull(),
  timestamp: real('timestamp').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
});
