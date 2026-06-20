import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check, X, Eye, Clock, CheckCircle, XCircle, Building2, Loader2,
  User, Settings, Layers, MapPin, Phone, Mail, Shield, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { StatsCard } from '../shared/StatsCard';
import { DataTable, type Column } from '../shared/DataTable';
import { Badge } from '../shared/StatusBadge';
import { normalizeList } from '../lib/api-adapters';
import { formatDate, cn } from '../lib/utils';
import {
  useSaasRequests,
  useSaasPendingRequests,
  useSaasRequestsSummary,
  useSaasRequest,
  useApproveCompanyRequest,
  useRejectCompanyRequest,
} from '../lib/api-hooks';

// ─── Types ────────────────────────────────────────────────────────

type SaasStatus = 'pendente' | 'aprovado' | 'rejeitado';
type FilterStatus = SaasStatus | 'all';

interface SaasReq {
  id: number;
  company_name: string;
  nif: string;
  email: string;
  phone: string;
  status: SaasStatus;
  created_at: string;
}

// ─── Maps ─────────────────────────────────────────────────────────

const STATUS_MAP: Record<SaasStatus, { label: string; variant: any }> = {
  pendente:  { label: 'Pendente',  variant: 'warning' },
  aprovado:  { label: 'Aprovado',  variant: 'success' },
  rejeitado: { label: 'Rejeitado', variant: 'error' },
};

function normalizeStatus(raw: string): SaasStatus {
  if (raw === 'aprovado' || raw === 'aprovada' || raw === 'approved') return 'aprovado';
  if (raw === 'rejeitado' || raw === 'rejeitada' || raw === 'rejected') return 'rejeitado';
  return 'pendente';
}

function adaptRequest(r: any): SaasReq {
  return {
    id:           Number(r.id ?? 0),
    company_name: r.nome_empresa ?? r.empresa?.nome ?? r.company_name ?? r.nome ?? '—',
    nif:          r.nif ?? r.empresa?.nif ?? r.cnpj ?? '—',
    email:        r.email ?? r.empresa?.email ?? '—',
    phone:        r.telefone ?? r.empresa?.telefone ?? r.phone ?? '—',
    status:       normalizeStatus(r.status ?? 'pendente'),
    created_at:   r.criado_em ?? r.created_at ?? new Date().toISOString(),
  };
}

// ─── Page ─────────────────────────────────────────────────────────

export function SaasRequestsPage() {
  const { data: rawAll }     = useSaasRequests();
  const { data: rawPending } = useSaasPendingRequests();
  const { data: summary }    = useSaasRequestsSummary();

  const all: SaasReq[]     = normalizeList(rawAll, adaptRequest);
  const pending: SaasReq[] = normalizeList(rawPending, adaptRequest);

  const summaryPending  = (summary as any)?.pendentes  ?? pending.length;
  const summaryApproved = (summary as any)?.aprovadas  ?? all.filter(r => r.status === 'aprovado').length;
  const summaryRejected = (summary as any)?.rejeitadas ?? all.filter(r => r.status === 'rejeitado').length;
  const summaryTotal    = (summary as any)?.total      ?? all.length;

  const approveMut = useApproveCompanyRequest();
  const rejectMut  = useRejectCompanyRequest();

  const [filter, setFilter]               = useState<FilterStatus>('all');
  const [viewId, setViewId]               = useState<number | null>(null);
  const [approveTarget, setApproveTarget] = useState<SaasReq | null>(null);
  const [rejectTarget, setRejectTarget]   = useState<SaasReq | null>(null);
  const [rejectReason, setRejectReason]   = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const filtered =
    filter === 'all'      ? all
    : filter === 'pendente' ? pending
    : all.filter(r => r.status === filter);

  const handleApprove = async () => {
    if (!approveTarget) return;
    setActionLoading(true);
    try {
      await approveMut.mutateAsync(approveTarget.id);
      toast.success(`Solicitação de "${approveTarget.company_name}" aprovada.`);
      setViewId(null);
    } catch {
      toast.error('Erro ao aprovar solicitação.');
    } finally {
      setApproveTarget(null);
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) { toast.warning('Informe o motivo da rejeição.'); return; }
    setActionLoading(true);
    try {
      await rejectMut.mutateAsync({ solicitacao_id: rejectTarget.id, motivo: rejectReason });
      toast.error(`Solicitação de "${rejectTarget.company_name}" rejeitada.`);
      setViewId(null);
    } catch {
      toast.error('Erro ao rejeitar solicitação.');
    } finally {
      setRejectTarget(null);
      setRejectReason('');
      setActionLoading(false);
    }
  };

  const columns: Column<SaasReq>[] = [
    {
      key: 'company_name', header: 'Empresa', sortable: true,
      cell: r => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{r.company_name}</p>
            <p className="text-xs text-muted-foreground">{r.nif}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email', header: 'Contacto',
      cell: r => (
        <div>
          <p className="text-sm text-foreground">{r.email}</p>
          <p className="text-xs text-muted-foreground">{r.phone}</p>
        </div>
      ),
    },
    {
      key: 'status', header: 'Estado',
      cell: r => {
        const s = STATUS_MAP[r.status] ?? { label: r.status, variant: 'neutral' };
        return <Badge label={s.label} variant={s.variant} dot />;
      },
    },
    {
      key: 'created_at', header: 'Enviado em', sortable: true,
      cell: r => <span className="text-sm text-muted-foreground">{formatDate(r.created_at)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Solicitações"
        description="Gerencie as solicitações de acesso das empresas à plataforma"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatsCard title="Total"      value={summaryTotal}    color="blue"   delay={0}    />
        <StatsCard title="Pendentes"  value={summaryPending}  color="yellow" delay={0.05} />
        <StatsCard title="Aprovadas"  value={summaryApproved} color="green"  delay={0.1}  />
        <StatsCard title="Rejeitadas" value={summaryRejected} color="red"    delay={0.15} />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {([
          { value: 'all',       label: 'Todas',      icon: null },
          { value: 'pendente',  label: 'Pendentes',  icon: Clock },
          { value: 'aprovado',  label: 'Aprovadas',  icon: CheckCircle },
          { value: 'rejeitado', label: 'Rejeitadas', icon: XCircle },
        ] as const).map(opt => {
          const Icon = opt.icon;
          return (
            <button key={opt.value} onClick={() => setFilter(opt.value)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                filter === opt.value
                  ? 'border-primary bg-primary text-white'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
              )}>
              {Icon && <Icon className="h-3 w-3" />}
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <DataTable
        data={filtered}
        columns={columns}
        searchFields={['company_name', 'nif', 'email']}
        rowActions={row => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => setViewId(row.id)} title="Ver detalhes"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Eye className="h-3.5 w-3.5" />
            </button>
            {row.status === 'pendente' && (
              <>
                <button onClick={() => setApproveTarget(row)} title="Aprovar"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => { setRejectTarget(row); setRejectReason(''); }} title="Rejeitar"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      />

      {/* ── Detail Drawer (fetches full data by id) ── */}
      <AnimatePresence>
        {viewId !== null && (
          <RequestDetailDrawer
            id={viewId}
            onClose={() => setViewId(null)}
            onApprove={req => { setViewId(null); setApproveTarget(req); }}
            onReject={req  => { setViewId(null); setRejectTarget(req); setRejectReason(''); }}
          />
        )}
      </AnimatePresence>

      {/* ── Approve Confirm ── */}
      <AnimatePresence>
        {approveTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setApproveTarget(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Aprovar solicitação</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Esta ação ativará o acesso da empresa.</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Confirma a aprovação de <strong className="text-foreground">"{approveTarget.company_name}"</strong>?
              </p>
              <div className="mt-6 flex justify-end gap-2.5">
                <button onClick={() => setApproveTarget(null)}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                  Cancelar
                </button>
                <button onClick={handleApprove} disabled={actionLoading}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60 transition-colors">
                  {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Aprovar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Reject Dialog ── */}
      <AnimatePresence>
        {rejectTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRejectTarget(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Rejeitar solicitação</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Informe o motivo da rejeição.</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Empresa: <strong className="text-foreground">"{rejectTarget.company_name}"</strong>
              </p>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">
                  Motivo da rejeição <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Descreva o motivo da rejeição..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                />
              </div>
              <div className="mt-5 flex justify-end gap-2.5">
                <button onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                  Cancelar
                </button>
                <button onClick={handleReject} disabled={actionLoading || !rejectReason.trim()}
                  className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60 transition-colors">
                  {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Rejeitar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────

interface DrawerProps {
  id: number;
  onClose: () => void;
  onApprove: (req: SaasReq) => void;
  onReject: (req: SaasReq) => void;
}

function RequestDetailDrawer({ id, onClose, onApprove, onReject }: DrawerProps) {
  const { data: raw, isLoading } = useSaasRequest(id);

  const d = raw as any;
  const empresa    = d?.empresa ?? {};
  const config     = empresa?.configuracao ?? {};
  const adminUser  = empresa?.admin_user ?? {};
  const depts      = empresa?.departamentos ?? [];
  const status     = normalizeStatus(d?.status ?? 'pendente');
  const statusInfo = STATUS_MAP[status];

  const req: SaasReq = {
    id,
    company_name: empresa?.nome ?? '—',
    nif:          empresa?.nif ?? '—',
    email:        empresa?.email ?? '—',
    phone:        empresa?.telefone ?? '—',
    status,
    created_at:   d?.criado_em ?? new Date().toISOString(),
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative z-10 flex h-full w-full max-w-xl flex-col bg-card shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {isLoading ? 'Carregando...' : (empresa?.nome ?? 'Detalhes')}
              </h2>
              <p className="text-xs text-muted-foreground">Solicitação #{id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isLoading && (
              <Badge label={statusInfo?.label ?? status} variant={statusInfo?.variant ?? 'neutral'} dot />
            )}
            <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-border">

              {/* Empresa */}
              <Section icon={Building2} title="Empresa">
                <Grid2>
                  <F label="Razão Social"     value={empresa?.nome} />
                  <F label="NIF / CNPJ"       value={empresa?.nif} />
                  <F label="E-mail"           value={empresa?.email} />
                  <F label="Telefone"         value={empresa?.telefone} />
                  <F label="Colaboradores"    value={empresa?.colaboradores_count} />
                  <F label="Estado empresa"   value={
                    empresa?.status_display ?? empresa?.status
                      ? <Badge label={empresa.status_display ?? empresa.status} variant={empresa.status === 'ativo' ? 'success' : 'warning'} dot />
                      : '—'
                  } />
                </Grid2>
                {empresa?.endereco && (
                  <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span>{empresa.endereco}</span>
                  </div>
                )}
                {(empresa?.latitude || empresa?.longitude) && (
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Lat: {empresa.latitude}</span>
                    <span>Lng: {empresa.longitude}</span>
                    {empresa.raio_geofencing && <span>Raio: {empresa.raio_geofencing}m</span>}
                  </div>
                )}
              </Section>

              {/* Admin User */}
              {(adminUser?.email || adminUser?.username) && (
                <Section icon={User} title="Utilizador Admin">
                  <Grid2>
                    <F label="Username"    value={adminUser?.username} />
                    <F label="E-mail"      value={adminUser?.email} />
                    <F label="Primeiro Nome" value={adminUser?.first_name} />
                    <F label="Último Nome"   value={adminUser?.last_name} />
                  </Grid2>
                </Section>
              )}

              {/* Configuração */}
              {config?.id && (
                <Section icon={Settings} title="Configuração">
                  <Grid2>
                    <F label="Entrada Padrão"    value={config?.horario_entrada_padrao} />
                    <F label="Saída Padrão"      value={config?.horario_saida_padrao} />
                    <F label="Início Almoço"     value={config?.horario_almoco_inicio} />
                    <F label="Fim Almoço"        value={config?.horario_almoco_fim} />
                    <F label="Dias Úteis"        value={config?.dias_uteis} />
                  </Grid2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <FlagBadge on={config?.permitir_presenca_fora_geofencing} label="Presença fora Geofencing" />
                    <FlagBadge on={config?.requer_foto_entrada}               label="Foto Entrada" />
                    <FlagBadge on={config?.requer_foto_saida}                 label="Foto Saída" />
                    <FlagBadge on={config?.notificar_atraso}                  label="Notif. Atraso" />
                    <FlagBadge on={config?.notificar_ausencia}                label="Notif. Ausência" />
                  </div>
                </Section>
              )}

              {/* Departamentos */}
              {depts.length > 0 && (
                <Section icon={Layers} title={`Departamentos (${depts.length})`}>
                  <div className="space-y-2">
                    {depts.map((dept: any) => (
                      <div key={dept.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                        <div>
                          <p className="text-xs font-medium text-foreground">{dept.nome}</p>
                          {dept.descricao && <p className="text-[11px] text-muted-foreground">{dept.descricao}</p>}
                          {dept.responsavel_nome && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Users className="h-3 w-3" /> {dept.responsavel_nome}
                            </p>
                          )}
                        </div>
                        <Badge label={dept.ativo ? 'Ativo' : 'Inativo'} variant={dept.ativo ? 'success' : 'neutral'} />
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Solicitação */}
              <Section icon={Shield} title="Solicitação">
                <Grid2>
                  <F label="Criado em"     value={d?.criado_em ? formatDate(d.criado_em) : '—'} />
                  <F label="Processado em" value={d?.processado_em ? formatDate(d.processado_em) : '—'} />
                  <F label="Admin Resp."   value={d?.admin_nome ?? (d?.admin_responsavel ? `#${d.admin_responsavel}` : '—')} />
                  <F label="Estado"        value={
                    <Badge label={d?.status_display ?? statusInfo?.label ?? status} variant={statusInfo?.variant ?? 'neutral'} dot />
                  } />
                </Grid2>
                {d?.motivo_rejeicao && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Motivo da Rejeição</p>
                    <p className="text-sm text-foreground bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                      {d.motivo_rejeicao}
                    </p>
                  </div>
                )}
              </Section>

            </div>
          )}
        </div>

        {/* Footer actions (only when pending) */}
        {!isLoading && status === 'pendente' && (
          <div className="flex-shrink-0 border-t border-border px-6 py-4 flex gap-3">
            <button
              onClick={() => onReject(req)}
              className="flex-1 rounded-lg border border-red-500/40 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/5 transition-colors">
              Rejeitar
            </button>
            <button
              onClick={() => onApprove(req)}
              className="flex-1 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 transition-colors">
              Aprovar
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>;
}

function F({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-medium text-foreground">{value ?? '—'}</div>
    </div>
  );
}

function FlagBadge({ on, label }: { on: boolean; label: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
      on
        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        : 'border-border bg-muted/40 text-muted-foreground line-through',
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', on ? 'bg-emerald-500' : 'bg-muted-foreground')} />
      {label}
    </span>
  );
}
