import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Eye, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { StatsCard } from '../shared/StatsCard';
import { DataTable, type Column } from '../shared/DataTable';
import { RequestStatusBadge, RequestTypeBadge } from '../shared/StatusBadge';
import type { Request, RequestStatus } from '../lib/types';
import { useVacations, useProcessVacation } from '../lib/api-hooks';
import { normalizeList } from '../lib/api-adapters';
import { formatDate, cn } from '../lib/utils';

export function RequestsPage() {
  const { data: rawVacations } = useVacations();
  const processMut = useProcessVacation();
  const requests: Request[] = normalizeList(rawVacations, (v: any): Request => ({
    id: String(v.id ?? ''),
    company_id: String(v.empresa ?? ''),
    employee_id: String(v.colaborador_id ?? v.colaborador ?? ''),
    employee_name: v.colaborador_nome ?? v.nome ?? '—',
    employee_registration: v.matricula ?? undefined,
    department_name: v.departamento ?? undefined,
    type: v.tipo ?? 'vacation',
    start_date: v.data_inicio ?? v.inicio ?? '',
    end_date: v.data_fim ?? v.fim ?? undefined,
    days: v.dias ?? undefined,
    description: v.justificativa ?? v.descricao ?? v.description ?? '',
    status: v.status === 'aprovado' ? 'approved' : v.status === 'rejeitado' ? 'rejected' : 'pending',
    reviewer_name: v.aprovador ?? undefined,
    reviewed_at: v.aprovado_em ?? undefined,
    created_at: v.criado_em ?? v.created_at ?? new Date().toISOString(),
  }));
  const [viewTarget, setViewTarget] = useState<Request | null>(null);
  const [approveTarget, setApproveTarget] = useState<Request | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Request | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');

  const filtered = statusFilter === 'all' ? requests : requests.filter(r => r.status === statusFilter);

  const counts = {
    pending:  requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    setReviewLoading(true);
    try {
      await processMut.mutateAsync({ id: Number(approveTarget.id), action: 'aprovar' });
      toast.success(`Solicitação de ${approveTarget.employee_name} aprovada.`);
    } catch {
      toast.error('Erro ao aprovar solicitação.');
    }
    setApproveTarget(null);
    setReviewLoading(false);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setReviewLoading(true);
    try {
      await processMut.mutateAsync({ id: Number(rejectTarget.id), action: 'rejeitar' });
      toast.error(`Solicitação de ${rejectTarget.employee_name} rejeitada.`);
    } catch {
      toast.error('Erro ao rejeitar solicitação.');
    }
    setRejectTarget(null);
    setReviewLoading(false);
  };

  const columns: Column<Request>[] = [
    { key: 'employee_name', header: 'Funcionário', sortable: true,
      cell: r => (
        <div>
          <p className="text-sm font-medium text-foreground">{r.employee_name}</p>
          <p className="text-xs text-muted-foreground">{r.department_name} · {r.employee_registration}</p>
        </div>
      )
    },
    { key: 'type', header: 'Tipo', cell: r => <RequestTypeBadge type={r.type} /> },
    { key: 'start_date', header: 'Período', sortable: true,
      cell: r => (
        <div className="text-sm text-foreground">
          {formatDate(r.start_date)}
          {r.end_date && ` → ${formatDate(r.end_date)}`}
          {r.days && <span className="ml-1 text-xs text-muted-foreground">({r.days} dias)</span>}
        </div>
      )
    },
    { key: 'description', header: 'Descrição',
      cell: r => <p className="max-w-xs truncate text-sm text-muted-foreground">{r.description}</p>
    },
    { key: 'status', header: 'Status', cell: r => <RequestStatusBadge status={r.status} /> },
    { key: 'created_at', header: 'Enviado em', sortable: true,
      cell: r => <span className="text-sm text-muted-foreground">{formatDate(r.created_at)}</span>
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Solicitações" description="Gerencie as solicitações dos colaboradores" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatsCard title="Pendentes" value={counts.pending} color="yellow" delay={0} />
        <StatsCard title="Aprovadas" value={counts.approved} color="green" delay={0.05} />
        <StatsCard title="Rejeitadas" value={counts.rejected} color="red" delay={0.1} />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'Todas' },
          { value: 'pending', label: 'Pendentes' },
          { value: 'approved', label: 'Aprovadas' },
          { value: 'rejected', label: 'Rejeitadas' },
        ].map(opt => (
          <button key={opt.value} onClick={() => setStatusFilter(opt.value as any)}
            className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              statusFilter === opt.value ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
            )}>{opt.label}</button>
        ))}
      </div>

      <DataTable
        data={filtered} columns={columns}
        searchFields={['employee_name', 'employee_registration', 'department_name', 'description']}
        rowActions={row => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => setViewTarget(row)} title="Ver detalhes"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Eye className="h-3.5 w-3.5" />
            </button>
            {row.status === 'pending' && (
              <>
                <button onClick={() => setApproveTarget(row)} title="Aprovar"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setRejectTarget(row)} title="Rejeitar"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      />

      {/* View Modal */}
      <AnimatePresence>
        {viewTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewTarget(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="text-sm font-semibold text-foreground">Detalhes da Solicitação</h2>
                <button onClick={() => setViewTarget(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <InfoRow label="Funcionário" value={viewTarget.employee_name ?? '—'} />
                  <InfoRow label="Matrícula" value={viewTarget.employee_registration ?? '—'} />
                  <InfoRow label="Departamento" value={viewTarget.department_name ?? '—'} />
                  <InfoRow label="Tipo" value={<RequestTypeBadge type={viewTarget.type} />} />
                  <InfoRow label="Status" value={<RequestStatusBadge status={viewTarget.status} />} />
                  <InfoRow label="Período" value={`${formatDate(viewTarget.start_date)}${viewTarget.end_date ? ` → ${formatDate(viewTarget.end_date)}` : ''}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                  <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3">{viewTarget.description}</p>
                </div>
                {viewTarget.review_notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Notas do Revisor ({viewTarget.reviewer_name})</p>
                    <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3">{viewTarget.review_notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Approve/Reject confirms */}
      {[
        { target: approveTarget, setTarget: setApproveTarget, onConfirm: handleApprove, title: 'Aprovar solicitação', desc: `Aprovar solicitação de "${approveTarget?.employee_name}"?`, confirmLabel: 'Aprovar', variant: 'default' as const },
        { target: rejectTarget, setTarget: setRejectTarget, onConfirm: handleReject, title: 'Rejeitar solicitação', desc: `Rejeitar solicitação de "${rejectTarget?.employee_name}"?`, confirmLabel: 'Rejeitar', variant: 'danger' as const },
      ].map(({ target, setTarget, onConfirm, title, desc, confirmLabel, variant }) => (
        <AnimatePresence key={title}>
          {target && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setTarget(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                <div className="mt-6 flex justify-end gap-2.5">
                  <button onClick={() => setTarget(null)} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">Cancelar</button>
                  <button onClick={onConfirm} disabled={reviewLoading}
                    className={cn('flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60',
                      variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
                    )}>
                    {reviewLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {confirmLabel}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      ))}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}
