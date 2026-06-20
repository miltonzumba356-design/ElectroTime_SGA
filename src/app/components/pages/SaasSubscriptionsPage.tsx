import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  PauseCircle, PlayCircle, Receipt, X as XIcon,
  Building2, Calendar, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { DataTable, type Column } from '../shared/DataTable';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { StatsCard } from '../shared/StatsCard';
import { Badge } from '../shared/StatusBadge';
import { normalizeList } from '../lib/api-adapters';
import { formatDate, cn } from '../lib/utils';
import {
  useSaasDashboard,
  useSaasSubscriptions,
  useSaasSubscriptionAction,
} from '../lib/api-hooks';

// ─── Types ────────────────────────────────────────────────────────

type SubscriptionStatus = 'trial' | 'ativa' | 'suspensa' | 'cancelada';

interface Subscription {
  id: number;
  empresa: number;
  empresa_nome: string;
  plano: number;
  plano_nome: string;
  status: SubscriptionStatus;
  status_display: string;
  inicio: string;
  proximo_vencimento: string | null;
}

type ActionType = 'suspend' | 'reactivate' | 'cancel' | 'generateInvoice';

interface PendingAction {
  type: ActionType;
  subscription: Subscription;
}

// ─── Helpers ──────────────────────────────────────────────────────

const STATUS_VARIANT: Record<SubscriptionStatus, 'info' | 'success' | 'warning' | 'neutral'> = {
  trial:    'info',
  ativa:    'success',
  suspensa: 'warning',
  cancelada: 'neutral',
};

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trial:    'Trial',
  ativa:    'Ativa',
  suspensa: 'Suspensa',
  cancelada: 'Cancelada',
};

const ACTION_META: Record<ActionType, { title: string; description: (s: Subscription) => string; confirmLabel: string; variant: 'danger' | 'warning' | 'default' }> = {
  suspend: {
    title: 'Suspender assinatura',
    description: s => `Tem a certeza que pretende suspender a assinatura de "${s.empresa_nome}"? A empresa perderá acesso à plataforma até ser reactivada.`,
    confirmLabel: 'Suspender',
    variant: 'warning',
  },
  reactivate: {
    title: 'Reactivar assinatura',
    description: s => `Reactivar a assinatura de "${s.empresa_nome}"? A empresa voltará a ter acesso à plataforma.`,
    confirmLabel: 'Reactivar',
    variant: 'default',
  },
  cancel: {
    title: 'Cancelar assinatura',
    description: s => `Tem a certeza que pretende cancelar definitivamente a assinatura de "${s.empresa_nome}"? Esta acção não pode ser desfeita.`,
    confirmLabel: 'Cancelar assinatura',
    variant: 'danger',
  },
  generateInvoice: {
    title: 'Gerar fatura',
    description: s => `Gerar uma nova fatura para a assinatura de "${s.empresa_nome}"?`,
    confirmLabel: 'Gerar fatura',
    variant: 'default',
  },
};

const ACTION_SUCCESS: Record<ActionType, string> = {
  suspend:         'Assinatura suspensa com sucesso.',
  reactivate:      'Assinatura reactivada com sucesso.',
  cancel:          'Assinatura cancelada com sucesso.',
  generateInvoice: 'Fatura gerada com sucesso.',
};

// ─── Filter chip ─────────────────────────────────────────────────

type FilterValue = 'todas' | SubscriptionStatus;

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: 'Todas', value: 'todas' },
  { label: 'Trial', value: 'trial' },
  { label: 'Ativa', value: 'ativa' },
  { label: 'Suspensa', value: 'suspensa' },
  { label: 'Cancelada', value: 'cancelada' },
];

// ─── Row action button ────────────────────────────────────────────

function ActionBtn({
  title, icon: Icon, onClick, danger = false, warning = false,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  danger?: boolean;
  warning?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors',
        danger && 'hover:text-red-500',
        warning && 'hover:text-amber-500',
        !danger && !warning && 'hover:text-foreground',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────

export function SaasSubscriptionsPage() {
  const { data: dashboardData } = useSaasDashboard();
  const { data: rawSubscriptions, isLoading } = useSaasSubscriptions();

  const suspendMut      = useSaasSubscriptionAction('suspend');
  const reactivateMut   = useSaasSubscriptionAction('reactivate');
  const cancelMut       = useSaasSubscriptionAction('cancel');
  const invoiceMut      = useSaasSubscriptionAction('generateInvoice');

  const [activeFilter, setActiveFilter] = useState<FilterValue>('todas');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Normalise subscriptions
  const subscriptions = normalizeList(rawSubscriptions, (s: any): Subscription => ({
    id: Number(s.id ?? 0),
    empresa: Number(s.empresa ?? 0),
    empresa_nome: s.empresa_nome ?? '—',
    plano: Number(s.plano ?? 0),
    plano_nome: s.plano_nome ?? '—',
    status: (s.status ?? 'trial') as SubscriptionStatus,
    status_display: s.status_display ?? STATUS_LABELS[(s.status ?? 'trial') as SubscriptionStatus] ?? s.status,
    inicio: s.inicio ?? '',
    proximo_vencimento: s.proximo_vencimento ?? null,
  }));

  // Stats from dashboard (fallback to counting from list)
  const stats = useMemo(() => {
    const dash = dashboardData as Record<string, any> | undefined;
    return {
      trial:    Number(dash?.assinaturas_trial     ?? dash?.trial     ?? subscriptions.filter(s => s.status === 'trial').length),
      ativa:    Number(dash?.assinaturas_ativas     ?? dash?.ativas    ?? subscriptions.filter(s => s.status === 'ativa').length),
      suspensa: Number(dash?.assinaturas_suspensas  ?? dash?.suspensas ?? subscriptions.filter(s => s.status === 'suspensa').length),
      cancelada:Number(dash?.assinaturas_canceladas ?? dash?.canceladas ?? subscriptions.filter(s => s.status === 'cancelada').length),
    };
  }, [dashboardData, subscriptions]);

  // Apply filter
  const filtered = useMemo(
    () => activeFilter === 'todas' ? subscriptions : subscriptions.filter(s => s.status === activeFilter),
    [subscriptions, activeFilter],
  );

  // Columns
  const columns: Column<Subscription>[] = [
    {
      key: 'empresa_nome',
      header: 'Empresa',
      sortable: true,
      cell: row => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{row.empresa_nome}</p>
            <p className="text-[10px] text-muted-foreground">Empresa #{row.empresa}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'plano_nome',
      header: 'Plano',
      sortable: true,
      cell: row => (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-foreground">
          <CheckCircle2 className="h-3 w-3 text-primary" />
          {row.plano_nome}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      cell: row => (
        <Badge
          label={row.status_display || STATUS_LABELS[row.status] || row.status}
          variant={STATUS_VARIANT[row.status] ?? 'neutral'}
          dot
        />
      ),
    },
    {
      key: 'inicio',
      header: 'Início',
      sortable: true,
      cell: row => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
          {row.inicio ? formatDate(row.inicio) : '—'}
        </div>
      ),
    },
    {
      key: 'proximo_vencimento',
      header: 'Próx. Vencimento',
      sortable: true,
      cell: row => {
        if (!row.proximo_vencimento) {
          return <span className="text-sm text-muted-foreground">—</span>;
        }
        const isOverdue = new Date(row.proximo_vencimento) < new Date();
        return (
          <span className={cn('text-sm', isOverdue ? 'font-medium text-red-500' : 'text-muted-foreground')}>
            {formatDate(row.proximo_vencimento)}
            {isOverdue && <span className="ml-1 text-[10px]">(vencido)</span>}
          </span>
        );
      },
    },
  ];

  // Execute action
  const executeAction = async () => {
    if (!pendingAction) return;
    setActionLoading(true);
    const { type, subscription } = pendingAction;
    const mutMap: Record<ActionType, typeof suspendMut> = {
      suspend:         suspendMut,
      reactivate:      reactivateMut,
      cancel:          cancelMut,
      generateInvoice: invoiceMut,
    };
    try {
      await mutMap[type].mutateAsync({ id: subscription.id });
      toast.success(ACTION_SUCCESS[type]);
      setPendingAction(null);
    } catch {
      toast.error('Não foi possível concluir a acção. Tente novamente.');
    } finally {
      setActionLoading(false);
    }
  };

  const startAction = (type: ActionType, subscription: Subscription) => {
    setPendingAction({ type, subscription });
  };

  // Confirm dialog meta
  const confirmMeta = pendingAction ? ACTION_META[pendingAction.type] : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assinaturas"
        description="Gestão do ciclo de vida das assinaturas das empresas"
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatsCard
          title="Em Trial"
          value={stats.trial}
          color="blue"
          delay={0}
        />
        <StatsCard
          title="Assinaturas Ativas"
          value={stats.ativa}
          color="green"
          delay={0.05}
        />
        <StatsCard
          title="Suspensas"
          value={stats.suspensa}
          color="yellow"
          delay={0.1}
        />
        <StatsCard
          title="Canceladas"
          value={stats.cancelada}
          color="red"
          delay={0.15}
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={cn(
              'rounded-full border px-3.5 py-1 text-xs font-medium transition-colors',
              activeFilter === f.value
                ? 'border-primary bg-primary text-white'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
            )}
          >
            {f.label}
            {f.value !== 'todas' && (
              <span
                className={cn(
                  'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]',
                  activeFilter === f.value ? 'bg-white/20' : 'bg-muted',
                )}
              >
                {subscriptions.filter(s => s.status === f.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        data={filtered}
        columns={columns}
        loading={isLoading}
        searchFields={['empresa_nome', 'plano_nome', 'status']}
        emptyTitle="Nenhuma assinatura encontrada"
        emptyDescription="Não existem assinaturas com os filtros seleccionados."
        rowActions={row => (
          <div className="flex items-center justify-end gap-1">
            {/* Suspender — visível se ativa ou trial */}
            {(row.status === 'ativa' || row.status === 'trial') && (
              <ActionBtn
                title="Suspender assinatura"
                icon={PauseCircle}
                onClick={() => startAction('suspend', row)}
                warning
              />
            )}

            {/* Reativar — visível se suspensa */}
            {row.status === 'suspensa' && (
              <ActionBtn
                title="Reactivar assinatura"
                icon={PlayCircle}
                onClick={() => startAction('reactivate', row)}
              />
            )}

            {/* Gerar fatura — visível se ativa ou trial */}
            {(row.status === 'ativa' || row.status === 'trial') && (
              <ActionBtn
                title="Gerar fatura"
                icon={Receipt}
                onClick={() => startAction('generateInvoice', row)}
              />
            )}

            {/* Cancelar — visível se não cancelada */}
            {row.status !== 'cancelada' && (
              <ActionBtn
                title="Cancelar assinatura"
                icon={XIcon}
                onClick={() => startAction('cancel', row)}
                danger
              />
            )}
          </div>
        )}
      />

      {/* Confirm dialog for actions */}
      <AnimatePresence>
        {pendingAction && confirmMeta && (
          <ConfirmDialog
            open
            onClose={() => setPendingAction(null)}
            onConfirm={executeAction}
            loading={actionLoading}
            title={confirmMeta.title}
            description={confirmMeta.description(pendingAction.subscription)}
            confirmLabel={confirmMeta.confirmLabel}
            variant={confirmMeta.variant}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
