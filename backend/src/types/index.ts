export interface Task {
  id: string;
  title: string;
  description?: string;
  scheduled_time: Date;
  discord_webhook_url: string;
  payload?: Record<string, any>; // JSONB field
  max_retry: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  is_completed: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TaskLog {
  id: string;
  task_id: string;
  execution_time: Date;
  status: 'success' | 'failed' | 'retrying';
  retry_count: number;
  message?: string;
  error_details?: Record<string, any>; // JSONB field
  created_at: Date;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  scheduled_time: string | Date;
  discord_webhook_url: string;
  payload?: Record<string, any>;
  max_retry?: number;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  scheduled_time?: string | Date;
  discord_webhook_url?: string;
  payload?: Record<string, any>;
  max_retry?: number;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  is_active?: boolean;
}

export interface DashboardStats {
  total_tasks: number;
  active_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  pending_tasks: number;
}
