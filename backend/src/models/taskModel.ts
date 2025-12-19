import pool from '../config/database';
import { Task, CreateTaskDto, UpdateTaskDto } from '../types';

class TaskModel {
  async createTask(taskData: CreateTaskDto): Promise<Task> {
    const query = `
      INSERT INTO tasks (title, description, scheduled_time, discord_webhook_url)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [
      taskData.title,
      taskData.description,
      taskData.scheduled_time,
      taskData.discord_webhook_url,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getAllTasks(): Promise<Task[]> {
    const query = 'SELECT * FROM tasks ORDER BY scheduled_time DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  async getTaskById(id: string): Promise<Task | null> {
    const query = 'SELECT * FROM tasks WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async getActiveTasks(): Promise<Task[]> {
    const query = `
      SELECT * FROM tasks
      WHERE is_active = true AND is_completed = false
      ORDER BY scheduled_time ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async updateTask(id: string, taskData: UpdateTaskDto): Promise<Task | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (taskData.title !== undefined) {
      fields.push(`title = $${paramCount}`);
      values.push(taskData.title);
      paramCount++;
    }

    if (taskData.description !== undefined) {
      fields.push(`description = $${paramCount}`);
      values.push(taskData.description);
      paramCount++;
    }

    if (taskData.scheduled_time !== undefined) {
      fields.push(`scheduled_time = $${paramCount}`);
      values.push(taskData.scheduled_time);
      paramCount++;
    }

    if (taskData.discord_webhook_url !== undefined) {
      fields.push(`discord_webhook_url = $${paramCount}`);
      values.push(taskData.discord_webhook_url);
      paramCount++;
    }

    if (taskData.is_active !== undefined) {
      fields.push(`is_active = $${paramCount}`);
      values.push(taskData.is_active);
      paramCount++;
    }

    if (fields.length === 0) {
      return this.getTaskById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE tasks
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteTask(id: string): Promise<boolean> {
    const query = 'DELETE FROM tasks WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export default new TaskModel();
