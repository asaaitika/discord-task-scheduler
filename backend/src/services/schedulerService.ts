import cron from 'node-cron';
import pool from '../config/database';
import discordService from './discordService';
import { Task } from '../types';

class SchedulerService {
  private cronJob: cron.ScheduledTask | null = null;

  start() {
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.checkAndExecuteTasks();
    });
    console.log('Task scheduler started (runs every minute)');
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('Task scheduler stopped');
    }
  }

  private async checkAndExecuteTasks() {
    try {
      const now = new Date();
      const query = `
        SELECT * FROM tasks
        WHERE is_active = true
        AND is_completed = false
        AND scheduled_time <= $1
        ORDER BY scheduled_time ASC
      `;

      const result = await pool.query(query, [now]);
      const tasks: Task[] = result.rows;

      for (const task of tasks) {
        await this.executeTask(task);
      }
    } catch (error) {
      console.error('Error checking tasks:', error);
    }
  }

  private async executeTask(task: Task) {
    try {
      const success = await discordService.sendTaskNotification(task);

      if (success) {
        await pool.query(
          'UPDATE tasks SET is_completed = true, updated_at = NOW() WHERE id = $1',
          [task.id]
        );
        console.log(`Task ${task.id} completed and marked as done`);
      } else {
        console.error(`Failed to send notification for task ${task.id}`);
      }
    } catch (error) {
      console.error(`Error executing task ${task.id}:`, error);
    }
  }
}

export default new SchedulerService();
