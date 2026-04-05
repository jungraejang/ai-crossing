import type { Villager } from '@ai-crossing/shared';
import { getRelationship } from './relationships';
import type { EventBus } from '../simulation/eventBus';

export interface VillagerTask {
  id: string;
  assignerId: string;
  assigneeId: string;
  objective: string;
  locationId: string;
  deadline: number;
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'failed';
  createdAt: number;
}

export class TaskDelegationSystem {
  private eventBus: EventBus;
  private tasks: Map<string, VillagerTask> = new Map();

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  createTask(
    assigner: Villager,
    assignee: Villager,
    objective: string,
    locationId: string,
    deadlineGameMinutes: number,
  ): VillagerTask | null {
    const relationship = getRelationship(assigner, assignee.profile.id);
    if (relationship < -10) return null;

    const task: VillagerTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      assignerId: assigner.profile.id,
      assigneeId: assignee.profile.id,
      objective,
      locationId,
      deadline: Date.now() + deadlineGameMinutes * 60000,
      status: 'pending',
      createdAt: Date.now(),
    };

    this.tasks.set(task.id, task);
    return task;
  }

  evaluateAcceptance(assignee: Villager, task: VillagerTask): boolean {
    const relationship = getRelationship(assignee, task.assignerId);
    const isbusy =
      assignee.state.currentAction?.type === 'working' ||
      assignee.state.currentAction?.type === 'sleeping';

    let acceptProbability = 0.5;
    acceptProbability += relationship * 0.005;
    if (isbusy) acceptProbability -= 0.3;
    if (assignee.state.energy < 30) acceptProbability -= 0.2;
    if (assignee.profile.traits.includes('helpful') || assignee.profile.traits.includes('loyal')) {
      acceptProbability += 0.15;
    }

    const accepted = Math.random() < Math.max(0.1, Math.min(0.95, acceptProbability));
    task.status = accepted ? 'accepted' : 'rejected';
    return accepted;
  }

  completeTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;
    task.status = 'completed';
  }

  getActiveTasks(villagerId: string): VillagerTask[] {
    return Array.from(this.tasks.values()).filter(
      (t) => t.assigneeId === villagerId && (t.status === 'accepted' || t.status === 'in_progress'),
    );
  }

  getAllTasks(): VillagerTask[] {
    return Array.from(this.tasks.values());
  }

  cleanupExpired(): void {
    const now = Date.now();
    for (const [id, task] of this.tasks) {
      if (
        now > task.deadline &&
        (task.status === 'pending' || task.status === 'accepted' || task.status === 'in_progress')
      ) {
        task.status = 'failed';
      }
    }
  }
}
