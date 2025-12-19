import { Request, Response } from 'express';
import dashboardService from '../services/dashboardService';

class DashboardController {
  async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await dashboardService.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  }
}

export default new DashboardController();
