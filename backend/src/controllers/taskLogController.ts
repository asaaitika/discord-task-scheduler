import { Request, Response } from 'express';
import taskLogModel from '../models/taskLogModel';

class TaskLogController {
  async getLogsByTaskId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const logs = await taskLogModel.getLogsByTaskId(id);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching task logs:', error);
      res.status(500).json({ error: 'Failed to fetch task logs' });
    }
  }

  async getRecentLogs(_req: Request, res: Response): Promise<void> {
    try {
      const logs = await taskLogModel.getRecentLogs(100);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching recent logs:', error);
      res.status(500).json({ error: 'Failed to fetch recent logs' });
    }
  }
}

export default new TaskLogController();
