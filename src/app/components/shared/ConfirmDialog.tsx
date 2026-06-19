import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  variant?: 'danger' | 'warning' | 'default';
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar ação',
  description = 'Tem certeza que deseja continuar? Esta ação não pode ser desfeita.',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading = false,
  variant = 'danger',
}: ConfirmDialogProps) {
  const confirmCls =
    variant === 'danger'
      ? 'bg-red-500 hover:bg-red-600 text-white'
      : variant === 'warning'
      ? 'bg-amber-500 hover:bg-amber-600 text-white'
      : 'bg-primary hover:bg-primary/90 text-primary-foreground';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                variant === 'danger' ? 'bg-red-500/10' : variant === 'warning' ? 'bg-amber-500/10' : 'bg-primary/10'
              )}>
                <AlertTriangle className={cn(
                  'h-5 w-5',
                  variant === 'danger' ? 'text-red-500' : variant === 'warning' ? 'text-amber-500' : 'text-primary'
                )} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={onClose}
                disabled={loading}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={cn('flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50', confirmCls)}
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
