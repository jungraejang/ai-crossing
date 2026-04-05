import { z } from 'zod';

export const villagerJobSchema = z.enum([
  'baker',
  'farmer',
  'shopkeeper',
  'carpenter',
  'herbalist',
  'musician',
]);

export const moodSchema = z.enum([
  'happy',
  'content',
  'neutral',
  'tired',
  'hungry',
  'stressed',
  'sad',
  'angry',
  'excited',
  'lonely',
]);

export const directionSchema = z.enum(['up', 'down', 'left', 'right']);

export const actionTypeSchema = z.enum([
  'idle',
  'walking',
  'working',
  'eating',
  'sleeping',
  'socializing',
  'resting',
  'wandering',
  'shopping',
  'crafting',
]);

export const itemTypeSchema = z.enum([
  'bread',
  'coffee',
  'vegetables',
  'herbs',
  'wood',
  'tools',
  'fish',
  'flowers',
]);

export const scheduleBlockSchema = z.object({
  startHour: z.number().min(0).max(23),
  endHour: z.number().min(0).max(24),
  action: actionTypeSchema,
  locationId: z.string(),
});

export const villagerProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  ageBand: z.enum(['young', 'adult', 'elder']),
  job: villagerJobSchema,
  traits: z.array(z.string()),
  likes: z.array(z.string()),
  dislikes: z.array(z.string()),
  homeId: z.string(),
  speakingStyle: z.string(),
  dailySchedule: z.array(scheduleBlockSchema),
});
