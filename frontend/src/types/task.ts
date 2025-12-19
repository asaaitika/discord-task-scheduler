export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';
export type TaskLogStatus = 'success' | 'failed' | 'retrying';

export interface Task {
  id: string;
  title: string;
  description?: string;
  scheduled_time: string;
  discord_webhook_url: string;
  payload?: Record<string, any>;
  max_retry: number;
  status: TaskStatus;
  is_completed: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskLog {
  id: string;
  task_id: string;
  execution_time: string;
  status: TaskLogStatus;
  retry_count: number;
  message?: string;
  error_details?: Record<string, any>;
  created_at: string;
}

export interface DashboardStats {
  total_tasks: number;
  active_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  pending_tasks: number;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  scheduled_time: string;
  discord_webhook_url: string;
  payload?: Record<string, any>;
  max_retry?: number;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  scheduled_time?: string;
  discord_webhook_url?: string;
  payload?: Record<string, any>;
  max_retry?: number;
  status?: TaskStatus;
  is_active?: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
