import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import taskController from '../../controllers/taskController';
import taskModel from '../../models/taskModel';
import {
  mockTask,
  mockTasks,
  mockCreateTaskDto,
  mockUpdateTaskDto,
} from '../fixtures/task.fixtures';
import { Task } from '../../types';

// Mock the task model
jest.mock('../../models/taskModel');
const mockedTaskModel = taskModel as jest.Mocked<typeof taskModel>;

describe('TaskController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup response mocks
    jsonMock = jest.fn();
    sendMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();

    mockRequest = {
      body: {},
      params: {},
    } as Partial<Request>;

    mockResponse = {
      status: statusMock,
      json: jsonMock,
      send: sendMock,
    } as Partial<Response>;

    (mockResponse.status as jest.Mock).mockReturnValue(mockResponse);
  });

  describe('createTask', () => {
    it('should create a new task successfully', async () => {
      mockRequest.body = mockCreateTaskDto;
      mockedTaskModel.createTask.mockResolvedValue(mockTask);

      await taskController.createTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockedTaskModel.createTask).toHaveBeenCalledWith(mockCreateTaskDto);
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockTask);
    });

    it('should return 400 when title is missing', async () => {
      const invalidDto = { ...mockCreateTaskDto };
      delete (invalidDto as any).title;
      mockRequest.body = invalidDto;

      await taskController.createTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Missing required fields: title, scheduled_time, discord_webhook_url',
      });
      expect(mockedTaskModel.createTask).not.toHaveBeenCalled();
    });

    it('should return 400 when scheduled_time is missing', async () => {
      const invalidDto = { ...mockCreateTaskDto };
      delete (invalidDto as any).scheduled_time;
      mockRequest.body = invalidDto;

      await taskController.createTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Missing required fields: title, scheduled_time, discord_webhook_url',
      });
    });

    it('should return 400 when discord_webhook_url is missing', async () => {
      const invalidDto = { ...mockCreateTaskDto };
      delete (invalidDto as any).discord_webhook_url;
      mockRequest.body = invalidDto;

      await taskController.createTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Missing required fields: title, scheduled_time, discord_webhook_url',
      });
    });

    it('should return 500 on database error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      mockRequest.body = mockCreateTaskDto;
      mockedTaskModel.createTask.mockRejectedValue(new Error('Database error'));

      await taskController.createTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to create task' });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error creating task:',
        expect.any(Error)
      );
    });
  });

  describe('getAllTasks', () => {
    it('should return all tasks', async () => {
      mockedTaskModel.getAllTasks.mockResolvedValue(mockTasks);

      await taskController.getAllTasks(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockedTaskModel.getAllTasks).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(mockTasks);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return empty array when no tasks', async () => {
      mockedTaskModel.getAllTasks.mockResolvedValue([]);

      await taskController.getAllTasks(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith([]);
    });

    it('should return 500 on database error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      mockedTaskModel.getAllTasks.mockRejectedValue(new Error('Database error'));

      await taskController.getAllTasks(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to fetch tasks' });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('getActiveTasks', () => {
    it('should return active tasks only', async () => {
      const activeTasks = mockTasks.filter(
        (task) => task.is_active && !task.is_completed
      );
      mockedTaskModel.getActiveTasks.mockResolvedValue(activeTasks);

      await taskController.getActiveTasks(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockedTaskModel.getActiveTasks).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(activeTasks);
    });

    it('should return 500 on database error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      mockedTaskModel.getActiveTasks.mockRejectedValue(new Error('Database error'));

      await taskController.getActiveTasks(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Failed to fetch active tasks',
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('getTaskById', () => {
    it('should return task by id', async () => {
      mockRequest.params = { id: mockTask.id };
      mockedTaskModel.getTaskById.mockResolvedValue(mockTask);

      await taskController.getTaskById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockedTaskModel.getTaskById).toHaveBeenCalledWith(mockTask.id);
      expect(jsonMock).toHaveBeenCalledWith(mockTask);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return 404 when task not found', async () => {
      mockRequest.params = { id: 'non-existent-id' };
      mockedTaskModel.getTaskById.mockResolvedValue(null);

      await taskController.getTaskById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Task not found' });
    });

    it('should return 500 on database error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      mockRequest.params = { id: 'test-id' };
      mockedTaskModel.getTaskById.mockRejectedValue(new Error('Database error'));

      await taskController.getTaskById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to fetch task' });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('updateTask', () => {
    it('should update task successfully', async () => {
      const updatedTask: Task = { ...mockTask, ...mockUpdateTaskDto, scheduled_time: new Date(mockTask.scheduled_time) };
      mockRequest.params = { id: mockTask.id };
      mockRequest.body = mockUpdateTaskDto;
      mockedTaskModel.updateTask.mockResolvedValue(updatedTask);

      await taskController.updateTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockedTaskModel.updateTask).toHaveBeenCalledWith(
        mockTask.id,
        mockUpdateTaskDto
      );
      expect(jsonMock).toHaveBeenCalledWith(updatedTask);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return 404 when task not found', async () => {
      mockRequest.params = { id: 'non-existent-id' };
      mockRequest.body = mockUpdateTaskDto;
      mockedTaskModel.updateTask.mockResolvedValue(null);

      await taskController.updateTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Task not found' });
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { title: 'Updated Title' };
      const updatedTask: Task = { ...mockTask, title: 'Updated Title' };
      mockRequest.params = { id: mockTask.id };
      mockRequest.body = partialUpdate;
      mockedTaskModel.updateTask.mockResolvedValue(updatedTask);

      await taskController.updateTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockedTaskModel.updateTask).toHaveBeenCalledWith(
        mockTask.id,
        partialUpdate
      );
      expect(jsonMock).toHaveBeenCalledWith(updatedTask);
    });

    it('should return 500 on database error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      mockRequest.params = { id: mockTask.id };
      mockRequest.body = mockUpdateTaskDto;
      mockedTaskModel.updateTask.mockRejectedValue(new Error('Database error'));

      await taskController.updateTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to update task' });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      mockRequest.params = { id: mockTask.id };
      mockedTaskModel.deleteTask.mockResolvedValue(true);

      await taskController.deleteTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockedTaskModel.deleteTask).toHaveBeenCalledWith(mockTask.id);
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });

    it('should return 404 when task not found', async () => {
      mockRequest.params = { id: 'non-existent-id' };
      mockedTaskModel.deleteTask.mockResolvedValue(false);

      await taskController.deleteTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Task not found' });
    });

    it('should return 500 on database error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      mockRequest.params = { id: mockTask.id };
      mockedTaskModel.deleteTask.mockRejectedValue(new Error('Database error'));

      await taskController.deleteTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to delete task' });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
