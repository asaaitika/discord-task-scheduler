import { z } from 'zod';

// Task creation schema
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string().optional(),
  scheduled_time: z
    .string()
    .min(1, 'Scheduled time is required')
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Invalid date format'),
  discord_webhook_url: z
    .string()
    .url('Must be a valid URL')
    .refine(
      (url) => url.includes('discord.com/api/webhooks/'),
      'Must be a valid Discord webhook URL'
    ),
  payload: z.string().optional(),
  max_retry: z
    .number()
    .int()
    .min(0, 'Max retry must be at least 0')
    .max(10, 'Max retry must be at most 10')
    .default(3),
});

// Task update schema
export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters')
    .optional(),
  description: z.string().optional(),
  scheduled_time: z
    .string()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Invalid date format')
    .optional(),
  discord_webhook_url: z
    .string()
    .url('Must be a valid URL')
    .refine(
      (url) => url.includes('discord.com/api/webhooks/'),
      'Must be a valid Discord webhook URL'
    )
    .optional(),
  payload: z.string().optional(),
  max_retry: z
    .number()
    .int()
    .min(0, 'Max retry must be at least 0')
    .max(10, 'Max retry must be at most 10')
    .optional(),
  is_active: z.boolean().optional(),
});

export type CreateTaskFormData = z.infer<typeof createTaskSchema>;
export type UpdateTaskFormData = z.infer<typeof updateTaskSchema>;

// Alias for compatibility
export type CreateTaskInput = CreateTaskFormData;
export type UpdateTaskInput = UpdateTaskFormData;
