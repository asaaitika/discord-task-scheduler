'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import TaskForm from '@/components/tasks/TaskForm';
import { Loading } from '@/components/ui/Loading';
import { apiClient } from '@/lib/api-client';
import { Task } from '@/types/task';

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getTaskById(taskId);
      setTask(data);
    } catch (error) {
      toast.error('Failed to load task');
      console.error('Task error:', error);
      router.push('/tasks');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !task) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Task</h1>
          <p className="mt-1 text-sm text-gray-500">Loading task details...</p>
        </div>
        <Loading size="lg" text="Loading task..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/tasks">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Task</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update task: {task.title}
        </p>
      </div>

      <TaskForm task={task} isEditing={true} />
    </div>
  );
}
