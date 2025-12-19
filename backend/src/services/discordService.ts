import axios, { AxiosError } from 'axios';
import { Task } from '../types';
import { retryWithRateLimit, RetryError } from '../utils/retry';

class DiscordService {
  async sendTaskNotification(task: Task, customPayload?: any): Promise<boolean> {
    try {
      // Use custom payload if provided, otherwise create default
      const payload: any = customPayload || {
        embeds: [
          {
            title: `Task Reminder: ${task.title}`,
            description: task.description,
            color: 0x0099ff,
            fields: [
              {
                name: 'Scheduled Time',
                value: new Date(task.scheduled_time).toLocaleString(),
                inline: true,
              },
              {
                name: 'Task ID',
                value: task.id,
                inline: true,
              },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      };

      // Wrap axios call with retry logic
      await retryWithRateLimit(async () => {
        const response = await axios.post(task.discord_webhook_url, payload, {
          timeout: 10000, // 10 second timeout
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Handle Discord rate limit headers
        if (response.headers['x-ratelimit-remaining'] === '0') {
          const resetAfter = response.headers['x-ratelimit-reset-after'];
          console.warn(
            `Discord rate limit reached. Reset after ${resetAfter}s`
          );
        }

        return response;
      });

      console.log(`Discord notification sent for task: ${task.id}`);
      return true;
    } catch (error) {
      if (error instanceof RetryError) {
        console.error(
          `Failed to send Discord notification after ${error.attempts} attempts:`,
          error.lastError.message
        );
      } else if (axios.isAxiosError(error)) {
        this.logAxiosError(error);
      } else {
        console.error('Error sending Discord notification:', error);
      }
      return false;
    }
  }

  async sendCustomMessage(
    webhookUrl: string,
    message: string
  ): Promise<boolean> {
    try {
      await retryWithRateLimit(async () => {
        return await axios.post(
          webhookUrl,
          { content: message },
          {
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      });

      return true;
    } catch (error) {
      if (error instanceof RetryError) {
        console.error(
          `Failed to send custom message after ${error.attempts} attempts:`,
          error.lastError.message
        );
      } else {
        console.error('Error sending custom Discord message:', error);
      }
      return false;
    }
  }

  private logAxiosError(error: AxiosError): void {
    if (error.response) {
      console.error(
        `Discord API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
      );
    } else if (error.request) {
      console.error('Discord API: No response received');
    } else {
      console.error('Discord API request setup error:', error.message);
    }
  }
}

export default new DiscordService();
