'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import TaskForm from '@/components/tasks/TaskForm';

export default function NewTaskPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/tasks">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Task</h1>
        <p className="mt-1 text-sm text-gray-500">
          Schedule a new Discord notification task
        </p>
      </div>

      <TaskForm />
    </div>
  );
}
