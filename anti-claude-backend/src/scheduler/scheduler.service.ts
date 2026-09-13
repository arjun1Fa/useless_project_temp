import cron from 'node-cron';
import { prisma } from '../db/client.js';
import { scheduledJobRepo } from '../db/repositories/scheduled-job.repo.js';
import { createTaskForEmployee } from '../tasks/task.engine.js';
import { FIXED_EMPLOYEE_ID, SCHEDULER_CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';

export const schedulerService = {
  /**
   * Schedule the next task after an employee completes a task.
   * Creates a DB record for idempotency — won't create duplicates.
   */
  async scheduleNextTask(userId: string): Promise<void> {
    const scheduledFor = new Date(Date.now() + SCHEDULER_CONFIG.NEXT_TASK_DELAY_MS);
    const idempotencyKey = `next_task_${userId}_${Math.floor(Date.now() / 60000)}`; // unique per minute

    try {
      // Check existing pending jobs
      const existing = await scheduledJobRepo.findPendingForUser(userId, 'NEXT_TASK');
      if (existing.length >= SCHEDULER_CONFIG.MAX_PENDING_JOBS_PER_USER) {
        logger.debug({ userId }, 'Max pending jobs reached, skipping schedule');
        return;
      }

      await scheduledJobRepo.create({
        user: { connect: { id: userId } },
        type: 'NEXT_TASK',
        scheduledFor,
        status: 'PENDING',
        payload: { userId },
        idempotencyKey,
      });

      logger.info({ userId, scheduledFor }, 'Next task scheduled');
    } catch (err: any) {
      // Unique constraint violation = duplicate, ignore
      if (err?.code === 'P2002') {
        logger.debug({ userId }, 'Duplicate scheduled job ignored');
      } else {
        logger.warn({ err }, 'Failed to schedule next task');
      }
    }
  },

  /**
   * Cancel all pending next-task jobs for a user (e.g., on reset).
   */
  async cancelPendingJobs(userId: string): Promise<void> {
    await scheduledJobRepo.cancelUserJobs(userId);
  },
};

/**
 * Start the background cron job that processes scheduled tasks.
 * Runs every minute to check for due jobs.
 */
export function startScheduler(): void {
  cron.schedule('* * * * *', async () => {
    try {
      const dueJobs = await scheduledJobRepo.findPending();

      for (const job of dueJobs) {
        // Mark as RUNNING to prevent double-execution
        await scheduledJobRepo.updateStatus(job.id, 'RUNNING');

        try {
          if (job.type === 'NEXT_TASK') {
            const payload = job.payload as { userId: string };
            logger.info({ jobId: job.id, userId: payload.userId }, 'Scheduler: firing NEXT_TASK');
            await createTaskForEmployee(payload.userId, { manualTrigger: false });
          }

          await scheduledJobRepo.updateStatus(job.id, 'COMPLETED');
        } catch (err) {
          logger.error({ jobId: job.id, err }, 'Scheduled job failed');
          await scheduledJobRepo.updateStatus(job.id, 'FAILED');
        }
      }
    } catch (err) {
      logger.error({ err }, 'Scheduler cron error');
    }
  });

  logger.info('Scheduler cron started (every minute)');
}
