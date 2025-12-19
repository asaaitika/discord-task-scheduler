import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import taskModel from '../../models/taskModel';
import { createMockPool, mockQueryResult } from '../mocks/database.mock';
import {
  mockTask,
  mockTasks,
  mockCreateTaskDto,
  mockUpdateTaskDto,
} from '../fixtures/task.fixtures';

// Mock the database pool
const mockPool = createMockPool();
jest.mock('../../config/database', () => ({
  default: mockPool,
}));

describe('TaskModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create a new task with all fields', async () => {
      const mockResult = mockQueryResult([mockTask]);
      (mockPool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await taskModel.createTask(mockCreateTaskDto);

      expect(result).toEqual(mockTask);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tasks'),
        [
          mockCreateTaskDto.title,
          mockCreateTaskDto.description,
          mockCreateTaskDto.scheduled_time,
          mockCreateTaskDto.discord_webhook_url,
          JSON.stringify(mockCreateTaskDto.payload),
          mockCreateTaskDto.max_retry,
        ]
      );
    });

    it('should create task with default max_retry when not provided', async () => {
      const dtoWithoutMaxRetry = { ...mockCreateTaskDto };
      delete dtoWithoutMaxRetry.max_retry;

      const mockResult = mockQueryResult([{ ...mockTask, max_retry: 3 }]);
      (mockPool.query as jest.Mock).mockResolvedValue(mockResult);

      await taskModel.createTask(dtoWithoutMaxRetry);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([3]) // default max_retry
      );
    });

    it('should create task with empty payload when not provided', async () => {
      const dtoWithoutPayload = { ...mockCreateTaskDto };
      delete dtoWithoutPayload.payload;

      const mockResult = mockQueryResult([mockTask]);
      (mockPool.query as jest.Mock).mockResolvedValue(mockResult);

      await taskModel.createTask(dtoWithoutPayload);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['{}'])
      );
    });

    it('should throw error on database failure', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(taskModel.createTask(mockCreateTaskDto)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('getAllTasks', () => {
    it('should return all tasks ordered by scheduled_time DESC', async () => {
      const mockResult = mockQueryResult(mockTasks);
      (mockPool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await taskModel.getAllTasks();

      expect(result).toEqual(mockTasks);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY scheduled_time DESC')
      );
    });

    it('should return empty array when no tasks exist', async () => {
      const mockResult = mockQueryResult([]);
      (mockPool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await taskModel.getAllTasks();

      expect(result).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await expect(taskModel.getAllTasks()).rejects.toThrow('Database error');
    });
  });

  describe('getTaskById', () => {
    it('should return task when found', async () => {
      const mockResult = mockQueryResult([mockTask]);
      (mockPool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await taskModel.getTaskById(mockTask.id);

      expect(result).toEqual(mockTask);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [mockTask.id]
      );
    });

    it('should return null when task not found', async () => {
      const mockResult = mockQueryResult([]);
      (mockPool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await taskModel.getTaskById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should throw error on database failure', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await expect(taskModel.getTaskById('test-id')).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('getActiveTasks', () => {
    it('should return only active and incomplete tasks', async () => {
      const activeTasks = mockTasks.filter(
        (task) => task.is_active && !task.is_completed
      );
      const mockResult = mockQueryResult(activeTasks);
      (mockPool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await taskModel.getActiveTasks();

      expect(result).toEqual(activeTasks);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE is_active = true AND is_completed = false')
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY scheduled_time ASC')
      );
    });

    it('should return empty array when no active tasks', async () => {
      const mockResult = mockQueryResult([]);
      (mockPool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await taskModel.getActiveTasks();

      expect(result).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await expect(taskModel.getActiveTasks()).rejects.toThrow('Database error');
    });
  });

  describe('updateTask', () => {
    it('should update task with provided fields', async () => {
      const updatedTask = { ...mockTask, ...mockUpdateTaskDto };
      const mockResult = mockQueryResult([updatedTask]);
      (mockPool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await taskModel.updateTask(mockTask.id, mockUpdateTaskDto);

      expect(result).toEqual(updatedTask);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE tasks'),
        expect.arrayContaining([
          mockUpdateTaskDto.title,
          mockUpdateTaskDto.description,
          mockUpdateTaskDto.status,
          mockUpdateTaskDto.is_active,
          mockTask.id,
        ])
      );
    });

    it('should update only title field', async () => {
      const updatedTask = { ...mockTask, title: 'New Title' };
      const mockResult = mockQueryResult([updatedTask]);
      (mockPool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await taskModel.updateTask(mockTask.id, {
        title: 'New Title',
      });

      expect(result).toEqual(updatedTask);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('title = $1'),
        expect.arrayContaining(['New Title', mockTask.id])
      );
    });

    it('should update payload field with JSON stringify', async () => {
      const newPayload = { content: 'Updated payload' };
      const updatedTask = { ...mockTask, payload: newPayload };
      const mockResult = mockQueryResult([updatedTask]);
      (mockPool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await taskModel.updateTask(mockTask.id, {
        payload: newPayload,
      });

      expect(result).toEqual(updatedTask);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('payload = $1'),
        expect.arrayContaining([JSON.stringify(newPayload), mockTask.id])
      );
    });

    it('should return existing task when no fields to update', async () => {
      const mockResult = mockQueryResult([mockTask]);
      (mockPool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await taskModel.updateTask(mockTask.id, {});

      expect(result).toEqual(mockTask);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [mockTask.id]
      );
    });

    it('should return null when task not found', async () => {
      const mockResult = mockQueryResult([]);
      (mockPool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await taskModel.updateTask('non-existent-id', mockUpdateTaskDto);

      expect(result).toBeNull();
    });

    it('should always update updated_at timestamp', async () => {
      const mockResult = mockQueryResult([mockTask]);
      (mockPool.query as jest.Mock).mockResolvedValue(mockResult);

      await taskModel.updateTask(mockTask.id, { title: 'New Title' });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('updated_at = NOW()'),
        expect.any(Array)
      );
    });

    it('should throw error on database failure', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        taskModel.updateTask(mockTask.id, mockUpdateTaskDto)
      ).rejects.toThrow('Database error');
    });
  });

  describe('deleteTask', () => {
    it('should delete task and return true when successful', async () => {
      const mockResult = mockQueryResult([], 1);
      (mockPool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await taskModel.deleteTask(mockTask.id);

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM tasks WHERE id = $1'),
        [mockTask.id]
      );
    });

    it('should return false when task not found', async () => {
      const mockResult = mockQueryResult([], 0);
      (mockPool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await taskModel.deleteTask('non-existent-id');

      expect(result).toBe(false);
    });

    it('should return false when rowCount is null', async () => {
      const mockResult = { ...mockQueryResult([]), rowCount: null };
      (mockPool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await taskModel.deleteTask('test-id');

      expect(result).toBe(false);
    });

    it('should throw error on database failure', async () => {
      (mockPool.query as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await expect(taskModel.deleteTask('test-id')).rejects.toThrow(
        'Database error'
      );
    });
  });
});
