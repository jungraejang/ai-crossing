import { pgTable, text, integer, jsonb } from 'drizzle-orm/pg-core';

export const locationsTable = pgTable('locations', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  name: text('name').notNull(),
  areaTag: text('area_tag').notNull(),
  x: integer('x').notNull(),
  y: integer('y').notNull(),
  width: integer('width').notNull().default(1),
  height: integer('height').notNull().default(1),
  openHour: integer('open_hour'),
  closeHour: integer('close_hour'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
});
