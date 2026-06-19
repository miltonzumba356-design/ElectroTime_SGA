import { cn } from '../lib/utils';
import type { EmployeeStatus, AttendanceStatus, RequestStatus, RequestType } from '../lib/types';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  error:   'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400',
  info:    'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
  neutral: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400',
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

export function Badge({ label, variant = 'default', dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {label}
    </span>
  );
}

// ---- Domain-specific helpers ----

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  const map: Record<EmployeeStatus, { label: string; variant: BadgeVariant }> = {
    active:   { label: 'Ativo', variant: 'success' },
    inactive: { label: 'Inativo', variant: 'neutral' },
    vacation: { label: 'Férias', variant: 'info' },
    leave:    { label: 'Afastado', variant: 'warning' },
  };
  const { label, variant } = map[status] ?? { label: status, variant: 'neutral' };
  return <Badge label={label} variant={variant} dot />;
}

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  const map: Record<AttendanceStatus, { label: string; variant: BadgeVariant }> = {
    present:  { label: 'Presente', variant: 'success' },
    absent:   { label: 'Ausente', variant: 'error' },
    late:     { label: 'Atrasado', variant: 'warning' },
    justified:{ label: 'Justificado', variant: 'info' },
    holiday:  { label: 'Feriado', variant: 'neutral' },
    vacation: { label: 'Férias', variant: 'info' },
    leave:    { label: 'Afastado', variant: 'warning' },
  };
  const { label, variant } = map[status] ?? { label: status, variant: 'neutral' };
  return <Badge label={label} variant={variant} dot />;
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const map: Record<RequestStatus, { label: string; variant: BadgeVariant }> = {
    pending:   { label: 'Pendente', variant: 'warning' },
    approved:  { label: 'Aprovado', variant: 'success' },
    rejected:  { label: 'Rejeitado', variant: 'error' },
    cancelled: { label: 'Cancelado', variant: 'neutral' },
  };
  const { label, variant } = map[status] ?? { label: status, variant: 'neutral' };
  return <Badge label={label} variant={variant} dot />;
}

export function RequestTypeBadge({ type }: { type: RequestType }) {
  const map: Record<RequestType, { label: string; variant: BadgeVariant }> = {
    vacation:        { label: 'Férias', variant: 'info' },
    leave:           { label: 'Afastamento', variant: 'warning' },
    overtime_bank:   { label: 'Banco de Horas', variant: 'default' },
    schedule_change: { label: 'Mudança de Horário', variant: 'neutral' },
    document_request:{ label: 'Documento', variant: 'neutral' },
    advance:         { label: 'Adiantamento', variant: 'warning' },
    other:           { label: 'Outro', variant: 'neutral' },
  };
  const { label, variant } = map[type] ?? { label: type, variant: 'neutral' };
  return <Badge label={label} variant={variant} />;
}

export function ActiveBadge({ active }: { active: boolean }) {
  return <Badge label={active ? 'Ativo' : 'Inativo'} variant={active ? 'success' : 'neutral'} dot />;
}
