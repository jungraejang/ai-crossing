import type { AIJob, AIJobType } from '@ai-crossing/shared';

let jobCounter = 0;

export function createAIJob(
  type: AIJobType,
  villagerId: string,
  input: unknown,
  priority: number = 5,
): AIJob {
  return {
    id: `job_${++jobCounter}_${Date.now()}`,
    type,
    villagerId,
    input,
    priority,
    createdAt: Date.now(),
    status: 'queued',
  };
}
