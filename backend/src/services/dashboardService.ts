import pool from '../config/database';
import { DashboardStats } from '../types';

class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const query = `
      SELECT
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE is_active = true AND is_completed = false) as active_tasks,
        COUNT(*) FILTER (WHERE is_completed = true) as completed_tasks,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_tasks,
        COUNT(*) FILTER (WHERE status = 'pending' AND is_active = true) as pending_tasks
      FROM tasks
    `;

    const result = await pool.query(query);
    const row = result.rows[0];

    return {
      total_tasks: parseInt(row.total_tasks),
      active_tasks: parseInt(row.active_tasks),
      completed_tasks: parseInt(row.completed_tasks),
      failed_tasks: parseInt(row.failed_tasks),
      pending_tasks: parseInt(row.pending_tasks),
    };
  }
}

export default new DashboardService();
