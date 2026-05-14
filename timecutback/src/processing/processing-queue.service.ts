import { Injectable, Logger } from '@nestjs/common';

export type QueueType = 'light' | 'heavy';

export interface QueueStatus {
  type: QueueType;
  activeJobs: number;
  maxConcurrent: number;
  waitingJobs: number;
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
  private waiting: Record<QueueType, (() => void)[]> = { light: [], heavy: [] };

  // Moyenne mobile des 10 dernières durées de job
  private recentDurations: Record<QueueType, number[]> = {
    light: [60],
    heavy: [180],
  };

  async enqueue<T>(type: QueueType, task: () => Promise<T>): Promise<T> {
    await this.acquire(type);
    const startTime = Date.now();

    try {
      return await task();
    } finally {
      this.recordDuration(type, (Date.now() - startTime) / 1000);
      this.release(type);
    }
  }

  getStatus(type: QueueType): QueueStatus {
    const activeJobs = this.active[type];
    const waitingJobs = this.waiting[type].length;
    const maxConcurrent = this.LIMITS[type];
    const slotsAvailable = activeJobs < maxConcurrent;

    const averageJobDurationSeconds = this.getAverageDuration(type);
    const queueLength = activeJobs + waitingJobs;
    const aheadOfNewJob = Math.max(queueLength - maxConcurrent + 1, 0);
    const estimatedWaitSeconds = slotsAvailable
      ? 0
      : Math.round((aheadOfNewJob * averageJobDurationSeconds) / maxConcurrent);

    return {
      type,
      activeJobs,
      maxConcurrent,
      waitingJobs,
      slotsAvailable,
      averageJobDurationSeconds: Math.round(averageJobDurationSeconds),
      estimatedWaitSeconds,
    };
  }

  private acquire(type: QueueType): Promise<void> {
    return new Promise((resolve) => {
      if (this.active[type] < this.LIMITS[type]) {
        this.active[type]++;
        this.logger.log(
          `[${type}] Slot acquired immediately. Active: ${this.active[type]}/${this.LIMITS[type]}`,
        );
        resolve();
      } else {
        this.logger.log(
          `[${type}] Queue full. Waiting. Position: ${this.waiting[type].length + 1}`,
        );
        this.waiting[type].push(() => {
          this.active[type]++;
          resolve();
        });
      }
    });
  }

  private release(type: QueueType): void {
    this.active[type]--;
    const next = this.waiting[type].shift();
    if (next) {
      next();
    }
    this.logger.log(
      `[${type}] Slot released. Active: ${this.active[type]}/${this.LIMITS[type]}, Waiting: ${this.waiting[type].length}`,
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
