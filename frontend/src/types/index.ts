export interface Task {
  id: string;
  title: string;
  description: string;
  scheduled_time: string;
  discord_webhook_url: string;
  is_completed: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskData {
  title: string;
  description: string;
  scheduled_time: string;
  discord_webhook_url: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  scheduled_time?: string;
  discord_webhook_url?: string;
  is_active?: boolean;
}
