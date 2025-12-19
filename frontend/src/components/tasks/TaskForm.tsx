'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { createTaskSchema, type CreateTaskInput } from '@/lib/validations';
import { apiClient } from '@/lib/api-client';
import { Task } from '@/types/task';
import { parseJSON, formatJSON } from '@/lib/utils';

interface TaskFormProps {
  task?: Task;
  isEditing?: boolean;
}

export default function TaskForm({ task, isEditing = false }: TaskFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: task
      ? {
          title: task.title,
          description: task.description || '',
          scheduled_time: new Date(task.scheduled_time)
            .toISOString()
            .slice(0, 16),
          discord_webhook_url: task.discord_webhook_url,
          payload: task.payload ? formatJSON(task.payload) : '{}',
          max_retry: task.max_retry,
        }
      : {
          title: '',
          description: '',
          scheduled_time: '',
          discord_webhook_url: '',
          payload: '{\n  "content": "Hello from Discord Task Scheduler!"\n}',
          max_retry: 3,
        },
  });

  const payloadValue = watch('payload');

  useEffect(() => {
    if (payloadValue) {
      const parsed = parseJSON(payloadValue);
      if (parsed.error) {
        setJsonError(parsed.error);
      } else {
        setJsonError(null);
      }
    }
  }, [payloadValue]);

  const onSubmit = async (data: CreateTaskInput) => {
    // Validate JSON payload
    const parsed = parseJSON(data.payload || '{}');
    if (parsed.error) {
      toast.error('Invalid JSON payload: ' + parsed.error);
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData = {
        title: data.title,
        description: data.description || undefined,
        scheduled_time: new Date(data.scheduled_time).toISOString(),
        discord_webhook_url: data.discord_webhook_url,
        payload: parsed.data,
        max_retry: data.max_retry,
      };

      if (isEditing && task) {
        await apiClient.updateTask(task.id, taskData);
        toast.success('Task updated successfully');
      } else {
        await apiClient.createTask(taskData);
        toast.success('Task created successfully');
      }

      router.push('/tasks');
      router.refresh();
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        `Failed to ${isEditing ? 'update' : 'create'} task`;
      toast.error(message);
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <Input
            label="Task Title"
            placeholder="e.g., Daily reminder"
            error={errors.title?.message}
            {...register('title')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Brief description of the task..."
              {...register('description')}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <Input
            label="Scheduled Time"
            type="datetime-local"
            error={errors.scheduled_time?.message}
            {...register('scheduled_time')}
          />

          <Input
            label="Discord Webhook URL"
            type="url"
            placeholder="https://discord.com/api/webhooks/..."
            error={errors.discord_webhook_url?.message}
            {...register('discord_webhook_url')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discord Payload (JSON)
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <Controller
                name="payload"
                control={control}
                render={({ field }) => (
                  <Editor
                    height="300px"
                    defaultLanguage="json"
                    value={field.value}
                    onChange={(value) => field.onChange(value || '{}')}
                    theme="vs-light"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                    }}
                  />
                )}
              />
            </div>
            {jsonError && (
              <p className="mt-1 text-sm text-red-600">{jsonError}</p>
            )}
            {errors.payload && (
              <p className="mt-1 text-sm text-red-600">
                {errors.payload.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              See{' '}
              <a
                href="https://discord.com/developers/docs/resources/webhook#execute-webhook"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Discord Webhook docs
              </a>{' '}
              for payload format
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Retry Attempts
              </label>
              <input
                type="number"
                min="0"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                {...register('max_retry', { valueAsNumber: true })}
              />
              {errors.max_retry && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.max_retry.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Status
              </label>
              <div className="flex items-center h-10">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  className="ml-2 text-sm text-gray-700"
                >
                  Active (task will run)
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
