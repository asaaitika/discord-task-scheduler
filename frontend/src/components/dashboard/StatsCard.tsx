import { LucideIcon } from 'lucide-react';
import Card from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  variant = 'default',
  trend,
}: StatsCardProps) {
  const variants = {
    default: {
      bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      icon: 'bg-blue-400/20 text-white',
      text: 'text-white',
    },
    success: {
      bg: 'bg-gradient-to-br from-green-500 to-green-600',
      icon: 'bg-green-400/20 text-white',
      text: 'text-white',
    },
    warning: {
      bg: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
      icon: 'bg-yellow-400/20 text-white',
      text: 'text-white',
    },
    error: {
      bg: 'bg-gradient-to-br from-red-500 to-red-600',
      icon: 'bg-red-400/20 text-white',
      text: 'text-white',
    },
    info: {
      bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      icon: 'bg-purple-400/20 text-white',
      text: 'text-white',
    },
  };

  const variantStyles = variants[variant];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105',
        variantStyles.bg
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className={cn('text-sm font-medium opacity-90', variantStyles.text)}>
            {title}
          </p>
          <p className={cn('mt-3 text-4xl font-bold tracking-tight', variantStyles.text)}>
            {value.toLocaleString()}
          </p>
          {trend && (
            <div className="mt-3 flex items-center">
              <span
                className={cn(
                  'text-xs font-semibold px-2 py-1 rounded-full',
                  trend.isPositive
                    ? 'bg-white/20 text-white'
                    : 'bg-white/20 text-white'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className={cn('ml-2 text-xs opacity-75', variantStyles.text)}>
                vs last week
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl backdrop-blur-sm',
            variantStyles.icon
          )}
        >
          <Icon className="h-7 w-7" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}
