import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { SearchX, FolderOpen } from 'lucide-react';
import { cn } from '../lib/utils';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  variant?: 'default' | 'search';
  className?: string;
}

export function EmptyState({
  title = 'Nenhum registro encontrado',
  description = 'Não há dados para exibir no momento.',
  action,
  icon,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const DefaultIcon = variant === 'search' ? SearchX : FolderOpen;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex flex-col items-center justify-center py-16 text-center', className)}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        {icon ?? <DefaultIcon className="h-7 w-7 text-muted-foreground" />}
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full animate-pulse">
      <div className="mb-3 flex gap-4 border-b border-border pb-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 flex-1 rounded bg-muted" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-border py-3.5">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className={cn('h-3 flex-1 rounded bg-muted', c === 0 && 'max-w-[80px]')} />
          ))}
        </div>
      ))}
    </div>
  );
}
