import { pgTable, text, jsonb, real, integer } from 'drizzle-orm/pg-core';

export const conversationsTable = pgTable('conversations', {
  id: text('id').primaryKey(),
  participants: jsonb('participants').$type<string[]>().notNull().default([]),
  turns: jsonb('turns')
    .$type<Array<{ speaker: string; text: string; mood?: string; timestamp: number }>>()
    .notNull()
    .default([]),
  location: text('location').notNull(),
  gameDay: integer('game_day').notNull(),
  startedAt: real('started_at').notNull(),
  endedAt: real('ended_at'),
  summary: text('summary'),
});
