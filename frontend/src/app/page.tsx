'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ListTodo, CheckCircle, XCircle, Clock, Plus, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentLogs from '@/components/dashboard/RecentLogs';
import Button from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { apiClient } from '@/lib/api-client';
import { DashboardStats, TaskLog } from '@/types/task';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<TaskLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsData, logsData] = await Promise.all([
        apiClient.getDashboardStats(),
        apiClient.getRecentLogs(10),
      ]);
      setStats(statsData);
      setRecentLogs(logsData);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Overview of your scheduled tasks
            </p>
          </div>
        </div>
        <Loading size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Overview of your scheduled tasks
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/tasks">
            <Button variant="outline" size="md">
              <TrendingUp className="h-4 w-4 mr-2" />
              View All Tasks
            </Button>
          </Link>
          <Link href="/tasks/new">
            <Button variant="primary" size="md">
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Tasks"
          value={stats.total_tasks}
          icon={ListTodo}
          variant="default"
        />
        <StatsCard
          title="Active Tasks"
          value={stats.active_tasks}
          icon={Clock}
          variant="info"
        />
        <StatsCard
          title="Completed"
          value={stats.completed_tasks}
          icon={CheckCircle}
          variant="success"
        />
        <StatsCard
          title="Failed"
          value={stats.failed_tasks}
          icon={XCircle}
          variant="error"
        />
      </div>

      {/* Recent Logs */}
      <div className="mt-8">
        <RecentLogs logs={recentLogs} isLoading={false} />
      </div>
    </div>
  );
}
