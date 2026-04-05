import { pgTable, text, jsonb } from 'drizzle-orm/pg-core';

export const schedulesTable = pgTable('schedules', {
  villagerId: text('villager_id').primaryKey(),
  blocks: jsonb('blocks')
    .$type<Array<{ startHour: number; endHour: number; action: string; locationId: string }>>()
    .notNull()
    .default([]),
});
