import { pgTable, text, jsonb, real } from 'drizzle-orm/pg-core';

export const villagersTable = pgTable('villagers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ageBand: text('age_band').notNull(),
  job: text('job').notNull(),
  traits: jsonb('traits').$type<string[]>().notNull().default([]),
  likes: jsonb('likes').$type<string[]>().notNull().default([]),
  dislikes: jsonb('dislikes').$type<string[]>().notNull().default([]),
  homeId: text('home_id').notNull(),
  speakingStyle: text('speaking_style').notNull(),
  dailySchedule: jsonb('daily_schedule')
    .$type<Array<{ startHour: number; endHour: number; action: string; locationId: string }>>()
    .notNull()
    .default([]),
  currentLocation: text('current_location').notNull().default(''),
  targetDestination: text('target_destination'),
  currentAction: jsonb('current_action'),
  hunger: real('hunger').notNull().default(50),
  energy: real('energy').notNull().default(100),
  stress: real('stress').notNull().default(0),
  boredom: real('boredom').notNull().default(0),
  sociability: real('sociability').notNull().default(50),
  mood: text('mood').notNull().default('neutral'),
  inventory: jsonb('inventory').$type<Array<{ id: string; type: string; quantity: number }>>().notNull().default([]),
  relationshipMap: jsonb('relationship_map').$type<Record<string, number>>().notNull().default({}),
  shortTermGoals: jsonb('short_term_goals').$type<string[]>().notNull().default([]),
  currentPlan: jsonb('current_plan').$type<string[]>().notNull().default([]),
  x: real('x').notNull().default(0),
  y: real('y').notNull().default(0),
  facing: text('facing').notNull().default('south'),
});
