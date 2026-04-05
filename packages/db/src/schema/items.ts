import { pgTable, text, integer } from 'drizzle-orm/pg-core';

export const itemsTable = pgTable('items', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  owner: text('owner').notNull(),
  location: text('location'),
  quantity: integer('quantity').notNull().default(1),
});
