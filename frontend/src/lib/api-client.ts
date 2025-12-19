import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  Task,
  TaskLog,
  DashboardStats,
  CreateTaskDto,
  UpdateTaskDto,
} from '@/types/task';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.client.interceptors.request.use((config) => {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      if (apiKey) {
        config.headers['x-api-key'] = apiKey;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          // Server responded with error status
          console.error('API Error:', error.response.data);
        } else if (error.request) {
          // Request made but no response
          console.error('Network Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.client.get<DashboardStats>('/dashboard/stats');
    return response.data;
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    const response = await this.client.get<Task[]>('/tasks');
    return response.data;
  }

  async getActiveTasks(): Promise<Task[]> {
    const response = await this.client.get<Task[]>('/tasks/active');
    return response.data;
  }

  async getTaskById(id: string): Promise<Task> {
    const response = await this.client.get<Task>(`/tasks/${id}`);
    return response.data;
  }

  async createTask(data: CreateTaskDto): Promise<Task> {
    const response = await this.client.post<Task>('/tasks', data);
    return response.data;
  }

  async updateTask(id: string, data: UpdateTaskDto): Promise<Task> {
    const response = await this.client.put<Task>(`/tasks/${id}`, data);
    return response.data;
  }

  async deleteTask(id: string): Promise<void> {
    await this.client.delete(`/tasks/${id}`);
  }

  // Task Logs
  async getTaskLogs(taskId: string): Promise<TaskLog[]> {
    const response = await this.client.get<TaskLog[]>(`/tasks/${taskId}/logs`);
    return response.data;
  }

  async getRecentLogs(limit: number = 20): Promise<TaskLog[]> {
    const response = await this.client.get<TaskLog[]>('/logs/recent', {
      params: { limit },
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
