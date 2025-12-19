import cron from 'node-cron';
import pool from '../config/database';
import discordService from './discordService';
import taskLogModel from '../models/taskLogModel';
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
        AND status != 'running'
        AND scheduled_time <= $1
        ORDER BY scheduled_time ASC
      `;

      const result = await pool.query(query, [now]);
      const tasks: Task[] = result.rows;

      if (tasks.length > 0) {
        console.log(`Found ${tasks.length} task(s) to execute`);
      }

      for (const task of tasks) {
        await this.executeTask(task);
      }
    } catch (error) {
      console.error('Error checking tasks:', error);
    }
  }

  private async executeTask(task: Task) {
    let retryCount = 0;
    const maxRetries = task.max_retry || 3;

    // Update task status to running
    await pool.query(
      "UPDATE tasks SET status = 'running', updated_at = NOW() WHERE id = $1",
      [task.id]
    );

    while (retryCount <= maxRetries) {
      try {
        console.log(`Executing task ${task.id} (attempt ${retryCount + 1}/${maxRetries + 1})`);

        // Send Discord notification with payload if available
        const payload = task.payload || {
          content: `Task: ${task.title}`,
          embeds: [
            {
              title: task.title,
              description: task.description || 'No description provided',
              color: 3066993,
            },
          ],
        };

        const success = await discordService.sendTaskNotification(task, payload);

        if (success) {
          // Log successful execution
          await taskLogModel.createLog({
            task_id: task.id,
            execution_time: new Date(),
            status: 'success',
            retry_count: retryCount,
            message: 'Task executed successfully',
          });

          // Mark task as completed
          await pool.query(
            "UPDATE tasks SET is_completed = true, status = 'completed', updated_at = NOW() WHERE id = $1",
            [task.id]
          );

          console.log(`Task ${task.id} completed successfully`);
          return;
        } else {
          throw new Error('Discord notification failed');
        }
      } catch (error) {
        retryCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        console.error(`Task ${task.id} failed (attempt ${retryCount}/${maxRetries + 1}): ${errorMessage}`);

        // Log failed attempt
        await taskLogModel.createLog({
          task_id: task.id,
          execution_time: new Date(),
          status: retryCount <= maxRetries ? 'retrying' : 'failed',
          retry_count: retryCount - 1,
          message: `Execution failed: ${errorMessage}`,
          error_details: {
            error: errorMessage,
            attempt: retryCount,
            max_retries: maxRetries,
          },
        });

        if (retryCount <= maxRetries) {
          // Wait before retry (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          // Max retries exceeded, mark as failed
          await pool.query(
            "UPDATE tasks SET status = 'failed', updated_at = NOW() WHERE id = $1",
            [task.id]
          );
          console.error(`Task ${task.id} failed after ${maxRetries + 1} attempts`);
        }
      }
    }
  }
}

export default new SchedulerService();
