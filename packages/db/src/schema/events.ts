import { pgTable, text, jsonb, integer, real } from 'drizzle-orm/pg-core';

export const eventsTable = pgTable('world_events', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  actors: jsonb('actors').$type<string[]>().notNull().default([]),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
  gameDay: integer('game_day').notNull(),
  gameHour: real('game_hour').notNull(),
  timestamp: real('timestamp').notNull(),
});
