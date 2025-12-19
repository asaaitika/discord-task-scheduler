import { Task, CreateTaskDto, UpdateTaskDto } from '../../types';

export const mockTask: Task = {
  id: 'test-task-id-123',
  title: 'Test Task',
  description: 'This is a test task',
  scheduled_time: new Date('2024-12-25T10:00:00Z'),
  discord_webhook_url: 'https://discord.com/api/webhooks/test/webhook',
  payload: {
    content: 'Test notification',
    embeds: [
      {
        title: 'Test Embed',
        description: 'Test embed description',
        color: 0x0099ff,
      },
    ],
  },
  max_retry: 3,
  status: 'pending',
  is_completed: false,
  is_active: true,
  created_at: new Date('2024-12-20T10:00:00Z'),
  updated_at: new Date('2024-12-20T10:00:00Z'),
};

export const mockCreateTaskDto: CreateTaskDto = {
  title: 'New Test Task',
  description: 'New test task description',
  scheduled_time: '2024-12-26T15:00:00Z',
  discord_webhook_url: 'https://discord.com/api/webhooks/new/webhook',
  payload: {
    content: 'New test notification',
  },
  max_retry: 5,
};

export const mockUpdateTaskDto: UpdateTaskDto = {
  title: 'Updated Test Task',
  description: 'Updated description',
  status: 'completed',
  is_active: false,
};

export const mockTasks: Task[] = [
  mockTask,
  {
    ...mockTask,
    id: 'test-task-id-456',
    title: 'Another Test Task',
    status: 'completed',
    is_completed: true,
  },
  {
    ...mockTask,
    id: 'test-task-id-789',
    title: 'Failed Test Task',
    status: 'failed',
    is_active: false,
  },
];
