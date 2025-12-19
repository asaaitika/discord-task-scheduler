'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { TaskLog } from '@/types/task';

interface RecentLogsProps {
  logs: TaskLog[];
  isLoading?: boolean;
}

export default function RecentLogs({ logs, isLoading = false }: RecentLogsProps) {
  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Logs</h3>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Logs</h3>
        <Link
          href="/logs"
          className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          View all
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">No logs yet</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(log.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    Task ID: {log.task_id.substring(0, 8)}...
                  </p>
                  <Badge status={log.status}>{log.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  Attempt {log.retry_count + 1}
                </p>
                {log.message && (
                  <p className="mt-1 text-xs text-gray-600 truncate">
                    {log.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formatDate(log.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
