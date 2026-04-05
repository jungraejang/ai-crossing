import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as villagers from './schema/villagers';
import * as locations from './schema/locations';
import * as events from './schema/events';
import * as memories from './schema/memories';
import * as conversations from './schema/conversations';
import * as items from './schema/items';
import * as schedules from './schema/schedules';

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/ai_crossing';

const client = postgres(connectionString);

export const db = drizzle(client, {
  schema: {
    ...villagers,
    ...locations,
    ...events,
    ...memories,
    ...conversations,
    ...items,
    ...schedules,
  },
});
