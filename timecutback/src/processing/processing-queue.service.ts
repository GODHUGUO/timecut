import { Injectable, Logger } from '@nestjs/common';

export type QueueType = 'light' | 'heavy';
export type Priority = 'high' | 'normal';

export interface QueueStatus {
  type: QueueType;
  activeJobs: number;
  maxConcurrent: number;
  waitingJobs: number;
  waitingHighPriority: number;
  waitingNormalPriority: number;
  slotsAvailable: boolean;
  averageJobDurationSeconds: number;
  estimatedWaitSeconds: number;
}

@Injectable()
export class ProcessingQueueService {
  private readonly logger = new Logger(ProcessingQueueService.name);

  private readonly LIMITS: Record<QueueType, number> = {
    light: 5,
    heavy: 2,
  };

  private active: Record<QueueType, number> = { light: 0, heavy: 0 };
  private waitingHigh: Record<QueueType, (() => void)[]> = {
    light: [],
    heavy: [],
  };
  private waitingNormal: Record<QueueType, (() => void)[]> = {
    light: [],
    heavy: [],
  };

  // Moyenne mobile des 10 dernières durées de job
  private recentDurations: Record<QueueType, number[]> = {
    light: [60],
    heavy: [180],
  };

  async enqueue<T>(
    type: QueueType,
    task: () => Promise<T>,
    priority: Priority = 'normal',
  ): Promise<T> {
    await this.acquire(type, priority);
    const startTime = Date.now();

    try {
      return await task();
    } finally {
      this.recordDuration(type, (Date.now() - startTime) / 1000);
      this.release(type);
    }
  }

  getStatus(type: QueueType, priority: Priority = 'normal'): QueueStatus {
    const activeJobs = this.active[type];
    const waitingHighPriority = this.waitingHigh[type].length;
    const waitingNormalPriority = this.waitingNormal[type].length;
    const waitingJobs = waitingHighPriority + waitingNormalPriority;
    const maxConcurrent = this.LIMITS[type];
    const slotsAvailable = activeJobs < maxConcurrent;

    const averageJobDurationSeconds = this.getAverageDuration(type);

    // Calcul du nombre de jobs à traiter AVANT le nouveau job selon sa priorité
    // - Priorité high : passe devant les normal mais derrière les autres high
    // - Priorité normal : passe derrière tous les autres (high + normal déjà en attente)
    const aheadInQueue =
      priority === 'high'
        ? waitingHighPriority
        : waitingHighPriority + waitingNormalPriority;
    const queueLength = activeJobs + aheadInQueue + 1;
    const aheadOfNewJob = Math.max(queueLength - maxConcurrent, 0);
    const estimatedWaitSeconds = slotsAvailable
      ? 0
      : Math.round((aheadOfNewJob * averageJobDurationSeconds) / maxConcurrent);

    return {
      type,
      activeJobs,
      maxConcurrent,
      waitingJobs,
      waitingHighPriority,
      waitingNormalPriority,
      slotsAvailable,
      averageJobDurationSeconds: Math.round(averageJobDurationSeconds),
      estimatedWaitSeconds,
    };
  }

  private acquire(type: QueueType, priority: Priority): Promise<void> {
    return new Promise((resolve) => {
      if (this.active[type] < this.LIMITS[type]) {
        this.active[type]++;
        this.logger.log(
          `[${type}/${priority}] Slot acquired immediately. Active: ${this.active[type]}/${this.LIMITS[type]}`,
        );
        resolve();
      } else {
        const job = () => {
          this.active[type]++;
          resolve();
        };
        const queue =
          priority === 'high' ? this.waitingHigh[type] : this.waitingNormal[type];
        queue.push(job);
        this.logger.log(
          `[${type}/${priority}] Queue full. Waiting. High: ${this.waitingHigh[type].length}, Normal: ${this.waitingNormal[type].length}`,
        );
      }
    });
  }

  private release(type: QueueType): void {
    this.active[type]--;
    // Servir d'abord les jobs prioritaires
    const next =
      this.waitingHigh[type].shift() ?? this.waitingNormal[type].shift();
    if (next) {
      next();
    }
    this.logger.log(
      `[${type}] Slot released. Active: ${this.active[type]}/${this.LIMITS[type]}, High waiting: ${this.waitingHigh[type].length}, Normal waiting: ${this.waitingNormal[type].length}`,
    );
  }

  private recordDuration(type: QueueType, seconds: number): void {
    const list = this.recentDurations[type];
    list.push(seconds);
    if (list.length > 10) list.shift();
  }

  private getAverageDuration(type: QueueType): number {
    const list = this.recentDurations[type];
    if (list.length === 0) return type === 'heavy' ? 180 : 60;
    return list.reduce((a, b) => a + b, 0) / list.length;
  }
}
