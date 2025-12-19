'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Edit,
  Trash2,
  Eye,
  Clock,
  MoreVertical,
  PlayCircle,
  PauseCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { TableSkeleton } from '@/components/ui/Loading';
import { formatDate, cn } from '@/lib/utils';
import { Task } from '@/types/task';
import { apiClient } from '@/lib/api-client';

interface TaskTableProps {
  tasks: Task[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export default function TaskTable({
  tasks,
  isLoading = false,
  onRefresh,
}: TaskTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    setDeletingId(id);
    try {
      await apiClient.deleteTask(id);
      toast.success('Task deleted successfully');
      onRefresh?.();
    } catch (error) {
      toast.error('Failed to delete task');
      console.error('Delete error:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (task: Task) => {
    setTogglingId(task.id);
    try {
      await apiClient.updateTask(task.id, {
        is_active: !task.is_active,
      });
      toast.success(
        `Task ${task.is_active ? 'paused' : 'activated'} successfully`
      );
      onRefresh?.();
    } catch (error) {
      toast.error('Failed to update task');
      console.error('Toggle error:', error);
    } finally {
      setTogglingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <TableSkeleton rows={5} />
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new task.
          </p>
          <div className="mt-6">
            <Link href="/tasks/new">
              <Button>Create Task</Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Task
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Scheduled Time
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Active
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="text-sm text-gray-500 truncate max-w-md">
                        {task.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(task.scheduled_time)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge status={task.status}>{task.status}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActive(task)}
                    disabled={togglingId === task.id}
                    className={cn(
                      'inline-flex items-center gap-1.5 text-sm font-medium transition-colors',
                      task.is_active
                        ? 'text-green-600 hover:text-green-700'
                        : 'text-gray-400 hover:text-gray-500',
                      togglingId === task.id && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {task.is_active ? (
                      <PlayCircle className="h-4 w-4" />
                    ) : (
                      <PauseCircle className="h-4 w-4" />
                    )}
                    {task.is_active ? 'Active' : 'Paused'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/tasks/${task.id}/logs`}>
                      <Button variant="ghost" size="sm" aria-label="View logs">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/tasks/${task.id}/edit`}>
                      <Button variant="ghost" size="sm" aria-label="Edit task">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(task.id)}
                      isLoading={deletingId === task.id}
                      aria-label="Delete task"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
