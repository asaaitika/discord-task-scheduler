import { Request, Response } from 'express';
import taskModel from '../models/taskModel';
import { CreateTaskDto, UpdateTaskDto } from '../types';

class TaskController {
  async createTask(req: Request, res: Response) {
    try {
      const taskData: CreateTaskDto = req.body;

      if (!taskData.title || !taskData.scheduled_time || !taskData.discord_webhook_url) {
        return res.status(400).json({
          error: 'Missing required fields: title, scheduled_time, discord_webhook_url',
        });
      }

      const task = await taskModel.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  }

  async getAllTasks(req: Request, res: Response) {
    try {
      const tasks = await taskModel.getAllTasks();
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  }

  async getActiveTasks(req: Request, res: Response) {
    try {
      const tasks = await taskModel.getActiveTasks();
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching active tasks:', error);
      res.status(500).json({ error: 'Failed to fetch active tasks' });
    }
  }

  async getTaskById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const task = await taskModel.getTaskById(id);

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json(task);
    } catch (error) {
      console.error('Error fetching task:', error);
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  }

  async updateTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const taskData: UpdateTaskDto = req.body;

      const task = await taskModel.updateTask(id, taskData);

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json(task);
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  }

  async deleteTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await taskModel.deleteTask(id);

      if (!success) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }
}

export default new TaskController();
