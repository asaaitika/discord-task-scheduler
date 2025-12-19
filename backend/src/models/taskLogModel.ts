import pool from '../config/database';
import { TaskLog } from '../types';

class TaskLogModel {
  async createLog(logData: Omit<TaskLog, 'id' | 'created_at'>): Promise<TaskLog> {
    const query = `
      INSERT INTO task_logs (task_id, execution_time, status, retry_count, message, error_details)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      logData.task_id,
      logData.execution_time || new Date(),
      logData.status,
      logData.retry_count || 0,
      logData.message || null,
      logData.error_details ? JSON.stringify(logData.error_details) : null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getLogsByTaskId(taskId: string): Promise<TaskLog[]> {
    const query = `
      SELECT * FROM task_logs
      WHERE task_id = $1
      ORDER BY execution_time DESC
    `;
    
    const result = await pool.query(query, [taskId]);
    return result.rows;
  }

  async getRecentLogs(limit: number = 50): Promise<TaskLog[]> {
    const query = `
      SELECT tl.*, t.title as task_title
      FROM task_logs tl
      JOIN tasks t ON tl.task_id = t.id
      ORDER BY tl.execution_time DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  async getLogById(id: string): Promise<TaskLog | null> {
    const query = 'SELECT * FROM task_logs WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async deleteLogsByTaskId(taskId: string): Promise<boolean> {
    const query = 'DELETE FROM task_logs WHERE task_id = $1';
    const result = await pool.query(query, [taskId]);
    return (result.rowCount ?? 0) > 0;
  }
}

export default new TaskLogModel();
