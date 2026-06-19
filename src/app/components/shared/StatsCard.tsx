import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: number;
  trendLabel?: string;
  description?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'slate';
  loading?: boolean;
  delay?: number;
}

const colorMap: Record<string, { bg: string; icon: string; text: string }> = {
  blue:   { bg: 'bg-blue-500/10',   icon: 'text-blue-500',   text: 'text-blue-500' },
  green:  { bg: 'bg-emerald-500/10', icon: 'text-emerald-500', text: 'text-emerald-600' },
  yellow: { bg: 'bg-amber-500/10',  icon: 'text-amber-500',  text: 'text-amber-600' },
  red:    { bg: 'bg-red-500/10',    icon: 'text-red-500',    text: 'text-red-600' },
  purple: { bg: 'bg-violet-500/10', icon: 'text-violet-500', text: 'text-violet-600' },
  slate:  { bg: 'bg-slate-500/10',  icon: 'text-slate-500',  text: 'text-slate-600' },
};

export function StatsCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  description,
  color = 'blue',
  loading = false,
  delay = 0,
}: StatsCardProps) {
  const c = colorMap[color];

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-3.5 w-24 rounded bg-muted" />
            <div className="h-8 w-16 rounded bg-muted" />
          </div>
          <div className="h-10 w-10 rounded-lg bg-muted" />
        </div>
        <div className="mt-3 h-3 w-32 rounded bg-muted" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay }}
      className="group rounded-xl border border-border bg-card p-5 hover:shadow-md hover:shadow-black/5 transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground tracking-tight">{value}</p>
        </div>
        {icon && (
          <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg', c.bg)}>
            <span className={c.icon}>{icon}</span>
          </div>
        )}
      </div>

      {(trend !== undefined || description) && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {trend !== undefined && (
            <>
              {trend > 0 ? (
                <TrendingUp className={cn('h-3.5 w-3.5', c.text)} />
              ) : trend < 0 ? (
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              ) : (
                <Minus className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className={cn('font-medium', trend > 0 ? c.text : trend < 0 ? 'text-red-500' : 'text-muted-foreground')}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            </>
          )}
          {trendLabel && <span className="text-muted-foreground">{trendLabel}</span>}
          {description && !trend && (
            <span className="text-muted-foreground">{description}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
