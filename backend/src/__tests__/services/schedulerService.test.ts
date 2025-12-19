// @ts-nocheck
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import schedulerService from '../../services/schedulerService';
import discordService from '../../services/discordService';
import taskLogModel from '../../models/taskLogModel';
import { createMockPool, mockQueryResult } from '../mocks/database.mock';
import { mockTask } from '../fixtures/task.fixtures';

// Mock dependencies
const mockPool = createMockPool();
jest.mock('../../config/database', () => ({
  default: mockPool,
}));

jest.mock('../../services/discordService');
const mockedDiscordService = discordService as jest.Mocked<typeof discordService>;

jest.mock('../../models/taskLogModel');
const mockedTaskLogModel = taskLogModel as jest.Mocked<typeof taskLogModel>;

// Mock node-cron
const mockCronSchedule = jest.fn();
const mockCronStop = jest.fn();
jest.mock('node-cron', () => ({
  default: {
    schedule: mockCronSchedule,
  },
}));

describe('SchedulerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup cron mock
    mockCronSchedule.mockReturnValue({
      stop: mockCronStop,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('start', () => {
    it('should start the cron job with correct schedule', () => {
      const consoleLogSpy = jest.spyOn(console, 'log');

      schedulerService.start();

      expect(mockCronSchedule).toHaveBeenCalledWith(
        '* * * * *',
        expect.any(Function)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Task scheduler started (runs every minute)'
      );
    });
  });

  describe('stop', () => {
    it('should stop the cron job', () => {
      const consoleLogSpy = jest.spyOn(console, 'log');

      schedulerService.start();
      schedulerService.stop();

      expect(mockCronStop).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('Task scheduler stopped');
    });

    it('should not crash if no job is running', () => {
      const consoleLogSpy = jest.spyOn(console, 'log');

      schedulerService.stop();

      expect(mockCronStop).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalledWith('Task scheduler stopped');
    });
  });

  describe('checkAndExecuteTasks', () => {
    it('should query for tasks due for execution', async () => {
      const mockResult = mockQueryResult([]);
      (mockPool.query as any).mockResolvedValue(mockResult);

      // Access the private method via the cron callback
      schedulerService.start();
      const cronCallback = mockCronSchedule.mock.calls[0][1] as () => Promise<void>;
      await cronCallback();

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE is_active = true'),
        expect.arrayContaining([expect.any(Date)])
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('AND is_completed = false'),
        expect.any(Array)
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("AND status != 'running'"),
        expect.any(Array)
      );
    });

    it('should log when tasks are found', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');
      const dueTasks = [mockTask];
      const mockResult = mockQueryResult(dueTasks);
      (mockPool.query as any).mockResolvedValue(mockResult);
      mockedDiscordService.sendTaskNotification.mockResolvedValue(true);
      mockedTaskLogModel.createLog.mockResolvedValue({} as any);

      schedulerService.start();
      const cronCallback = mockCronSchedule.mock.calls[0][1] as () => Promise<void>;
      await cronCallback();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Found ${dueTasks.length} task(s) to execute`
      );
    });

    it('should handle query errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      (mockPool.query as any).mockRejectedValue(new Error('Database error'));

      schedulerService.start();
      const cronCallback = mockCronSchedule.mock.calls[0][1] as () => Promise<void>;
      await cronCallback();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error checking tasks:',
        expect.any(Error)
      );
    });
  });

  describe('executeTask', () => {
    const setupTaskExecution = async (taskToExecute = mockTask) => {
      const mockResult = mockQueryResult([taskToExecute]);
      (mockPool.query as any).mockResolvedValue(mockResult);

      schedulerService.start();
      const cronCallback = mockCronSchedule.mock.calls[0][1] as () => Promise<void>;
      return cronCallback;
    };

    it('should update task status to running before execution', async () => {
      const cronCallback = await setupTaskExecution();
      mockedDiscordService.sendTaskNotification.mockResolvedValue(true);
      mockedTaskLogModel.createLog.mockResolvedValue({} as any);

      await cronCallback();

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE tasks SET status = 'running'"),
        [mockTask.id]
      );
    });

    it('should send Discord notification with default payload', async () => {
      const cronCallback = await setupTaskExecution();
      mockedDiscordService.sendTaskNotification.mockResolvedValue(true);
      mockedTaskLogModel.createLog.mockResolvedValue({} as any);

      await cronCallback();

      expect(mockedDiscordService.sendTaskNotification).toHaveBeenCalledWith(
        mockTask,
        expect.objectContaining({
          content: `Task: ${mockTask.title}`,
          embeds: expect.arrayContaining([
            expect.objectContaining({
              title: mockTask.title,
              description: mockTask.description,
            }),
          ]),
        })
      );
    });

    it('should send Discord notification with custom payload if available', async () => {
      const taskWithPayload = {
        ...mockTask,
        payload: {
          content: 'Custom content',
          embeds: [{ title: 'Custom embed' }],
        },
      };
      const cronCallback = await setupTaskExecution(taskWithPayload);
      mockedDiscordService.sendTaskNotification.mockResolvedValue(true);
      mockedTaskLogModel.createLog.mockResolvedValue({} as any);

      await cronCallback();

      expect(mockedDiscordService.sendTaskNotification).toHaveBeenCalledWith(
        taskWithPayload,
        taskWithPayload.payload
      );
    });

    it('should mark task as completed on success', async () => {
      const cronCallback = await setupTaskExecution();
      mockedDiscordService.sendTaskNotification.mockResolvedValue(true);
      mockedTaskLogModel.createLog.mockResolvedValue({} as any);

      await cronCallback();

      expect(mockedTaskLogModel.createLog).toHaveBeenCalledWith({
        task_id: mockTask.id,
        execution_time: expect.any(Date),
        status: 'success',
        retry_count: 0,
        message: 'Task executed successfully',
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining(
          "UPDATE tasks SET is_completed = true, status = 'completed'"
        ),
        [mockTask.id]
      );
    });

    it('should retry on failure with exponential backoff', async () => {
      jest.useRealTimers(); // Need real timers for delay testing

      const cronCallback = await setupTaskExecution();
      mockedDiscordService.sendTaskNotification
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);
      mockedTaskLogModel.createLog.mockResolvedValue({} as any);

      const startTime = Date.now();
      await cronCallback();
      const elapsed = Date.now() - startTime;

      // Should have waited ~1000ms before retry (exponential backoff starting at 1000ms)
      expect(elapsed).toBeGreaterThanOrEqual(1000);
      expect(mockedDiscordService.sendTaskNotification).toHaveBeenCalledTimes(2);

      jest.useFakeTimers();
    });

    it('should log retry attempts', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');
      const consoleErrorSpy = jest.spyOn(console, 'error');

      const cronCallback = await setupTaskExecution();
      mockedDiscordService.sendTaskNotification
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);
      mockedTaskLogModel.createLog.mockResolvedValue({} as any);

      await cronCallback();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Task'),
        expect.stringContaining('failed (attempt 1/')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Retrying in')
      );
    });

    it('should create log entry for retrying status', async () => {
      const cronCallback = await setupTaskExecution();
      mockedDiscordService.sendTaskNotification
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);
      mockedTaskLogModel.createLog.mockResolvedValue({} as any);

      await cronCallback();

      expect(mockedTaskLogModel.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          task_id: mockTask.id,
          status: 'retrying',
          retry_count: 0,
          message: expect.stringContaining('Execution failed'),
        })
      );
    });

    it('should mark task as failed after max retries exceeded', async () => {
      const taskWithLowRetry = { ...mockTask, max_retry: 1 };
      const cronCallback = await setupTaskExecution(taskWithLowRetry);
      mockedDiscordService.sendTaskNotification.mockResolvedValue(false);
      mockedTaskLogModel.createLog.mockResolvedValue({} as any);

      await cronCallback();

      expect(mockedDiscordService.sendTaskNotification).toHaveBeenCalledTimes(2); // Initial + 1 retry
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE tasks SET status = 'failed'"),
        [taskWithLowRetry.id]
      );
    });

    it('should create failed log entry after max retries', async () => {
      const taskWithLowRetry = { ...mockTask, max_retry: 1 };
      const cronCallback = await setupTaskExecution(taskWithLowRetry);
      mockedDiscordService.sendTaskNotification.mockResolvedValue(false);
      mockedTaskLogModel.createLog.mockResolvedValue({} as any);

      await cronCallback();

      const failedLogCall = (mockedTaskLogModel.createLog as jest.Mock).mock.calls.find(
        (call) => call[0].status === 'failed'
      );
      expect(failedLogCall).toBeDefined();
      expect(failedLogCall[0]).toMatchObject({
        task_id: taskWithLowRetry.id,
        status: 'failed',
      });
    });

    it('should use default max_retry of 3 if not specified', async () => {
      const taskWithoutMaxRetry = { ...mockTask, max_retry: undefined };
      const cronCallback = await setupTaskExecution(taskWithoutMaxRetry);
      mockedDiscordService.sendTaskNotification.mockResolvedValue(false);
      mockedTaskLogModel.createLog.mockResolvedValue({} as any);

      await cronCallback();

      // Should try 4 times total (initial + 3 retries)
      expect(mockedDiscordService.sendTaskNotification).toHaveBeenCalledTimes(4);
    });

    it('should apply exponential backoff with cap at 10 seconds', async () => {
      jest.useRealTimers();

      const taskWithHighRetry = { ...mockTask, max_retry: 10 };
      const cronCallback = await setupTaskExecution(taskWithHighRetry);
      mockedDiscordService.sendTaskNotification
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);
      mockedTaskLogModel.createLog.mockResolvedValue({} as any);

      const consoleLogSpy = jest.spyOn(console, 'log');

      await cronCallback();

      // Check that delay is capped at 10000ms
      const retryLogs = consoleLogSpy.mock.calls.filter((call) =>
        call[0]?.toString().includes('Retrying in')
      );

      // Later retries should be capped at 10000ms
      const hasMaxDelay = retryLogs.some((call) =>
        call[0]?.toString().includes('10000ms')
      );
      expect(hasMaxDelay).toBe(true);

      jest.useFakeTimers();
    });

    it('should handle error details in log', async () => {
      const cronCallback = await setupTaskExecution();
      const testError = new Error('Test error message');
      mockedDiscordService.sendTaskNotification.mockRejectedValue(testError);
      mockedTaskLogModel.createLog.mockResolvedValue({} as any);

      await cronCallback();

      expect(mockedTaskLogModel.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Test error message'),
          error_details: expect.objectContaining({
            error: 'Test error message',
          }),
        })
      );
    });

    it('should log execution attempts', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');
      const cronCallback = await setupTaskExecution();
      mockedDiscordService.sendTaskNotification.mockResolvedValue(true);
      mockedTaskLogModel.createLog.mockResolvedValue({} as any);

      await cronCallback();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Executing task ${mockTask.id} (attempt 1/4)`)
      );
    });

    it('should log completion message', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');
      const cronCallback = await setupTaskExecution();
      mockedDiscordService.sendTaskNotification.mockResolvedValue(true);
      mockedTaskLogModel.createLog.mockResolvedValue({} as any);

      await cronCallback();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Task ${mockTask.id} completed successfully`)
      );
    });

    it('should log final failure after max retries', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const taskWithLowRetry = { ...mockTask, max_retry: 0 };
      const cronCallback = await setupTaskExecution(taskWithLowRetry);
      mockedDiscordService.sendTaskNotification.mockResolvedValue(false);
      mockedTaskLogModel.createLog.mockResolvedValue({} as any);

      await cronCallback();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Task ${taskWithLowRetry.id} failed after 1 attempts`)
      );
    });
  });
});
