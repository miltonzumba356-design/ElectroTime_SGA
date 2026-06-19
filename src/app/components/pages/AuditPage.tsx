import { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Download, Search, Shield, User, Building2, Settings, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../shared/PageHeader';
import { StatsCard } from '../shared/StatsCard';
import { Badge } from '../shared/StatusBadge';
import { formatDateTime, cn } from '../lib/utils';
import { useSaasLogs } from '../lib/api-hooks';
import { normalizeList } from '../lib/api-adapters';

type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'export' | 'approve' | 'reject';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  user_role: string;
  company: string;
  action: AuditAction;
  resource: string;
  detail: string;
  ip: string;
  status: 'success' | 'failed';
}

const ACTION_MAP: Record<AuditAction, { label: string; variant: any; color: string }> = {
  create:  { label: 'Criação',      variant: 'success', color: 'text-emerald-500' },
  update:  { label: 'Atualização',  variant: 'info',    color: 'text-blue-500' },
  delete:  { label: 'Exclusão',     variant: 'error',   color: 'text-red-500' },
  login:   { label: 'Login',        variant: 'neutral', color: 'text-slate-500' },
  export:  { label: 'Exportação',   variant: 'default', color: 'text-primary' },
  approve: { label: 'Aprovação',    variant: 'success', color: 'text-emerald-500' },
  reject:  { label: 'Rejeição',     variant: 'error',   color: 'text-red-500' },
};

const RESOURCE_ICONS: Record<string, typeof BookOpen> = {
  'Folha de Salário': Shield,
  'Utilizador': User,
  'Presença': User,
  'Contrato': BookOpen,
  'Sistema': Settings,
  'Declaração': BookOpen,
  'Geofencing': Shield,
  'Empresa': Building2,
  'Falta': User,
};

export function AuditPage() {
  const { data: rawLogs } = useSaasLogs();
  const logs: AuditLog[] = normalizeList(rawLogs, (l: any): AuditLog => ({
    id: String(l.id ?? ''),
    timestamp: l.criado_em ?? l.timestamp ?? l.created_at ?? new Date().toISOString(),
    user: l.usuario ?? l.user ?? '—',
    user_role: l.role ?? l.user_role ?? '—',
    company: l.empresa ?? l.company ?? '—',
    action: l.acao ?? l.action ?? 'create',
    resource: l.recurso ?? l.resource ?? '—',
    detail: l.detalhe ?? l.detail ?? l.descricao ?? '',
    ip: l.ip ?? '—',
    status: l.status === 'falhou' ? 'failed' : 'success',
  }));
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<AuditAction | 'all'>('all');

  const cutoff = new Date(Date.now() - 24*60*60*1000).toISOString();
  const filtered = logs.filter(log => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return log.user.toLowerCase().includes(q) || log.detail.toLowerCase().includes(q) || log.resource.toLowerCase().includes(q);
    }
    return true;
  });
  const failedLogs = logs.filter(l => l.status === 'failed');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria"
        description="Log de todas as ações críticas na plataforma"
        actions={
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground hover:bg-muted transition-colors">
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatsCard title="Eventos Hoje" value={logs.filter(l => l.timestamp > cutoff).length} color="blue" delay={0} />
        <StatsCard title="Erros / Falhas" value={failedLogs.length} color="red" delay={0.05} />
        <StatsCard title="Exportações" value={logs.filter(l => l.action === 'export').length} color="purple" delay={0.1} />
        <StatsCard title="Total de Eventos" value={logs.length} color="green" delay={0.15} />
      </div>

      {/* Security alert */}
      {failedLogs.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3.5">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-foreground">
            <strong>{failedLogs.length} tentativa{failedLogs.length > 1 ? 's' : ''} de acesso falhada{failedLogs.length > 1 ? 's' : ''}</strong> detectada{failedLogs.length > 1 ? 's' : ''} nos últimos registos.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por utilizador, recurso..."
            className="h-9 w-full rounded-lg border border-border bg-input-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'login', 'create', 'update', 'delete', 'export', 'approve'] as const).map(a => (
            <button key={a} onClick={() => setActionFilter(a)}
              className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                actionFilter === a ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground hover:border-primary/50')}>
              {a === 'all' ? 'Todos' : ACTION_MAP[a].label}
            </button>
          ))}
        </div>
      </div>

      {/* Log list */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Timestamp', 'Utilizador', 'Empresa', 'Ação', 'Recurso', 'Detalhe', 'IP', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => {
                const action = ACTION_MAP[log.action] ?? { label: log.action, variant: 'neutral', color: '' };
                const ResourceIcon = RESOURCE_ICONS[log.resource] ?? BookOpen;
                return (
                  <motion.tr key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={cn('border-b border-border last:border-0 hover:bg-muted/20 transition-colors',
                      log.status === 'failed' && 'bg-red-500/3')}>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-foreground">{log.user}</p>
                      <p className="text-[10px] text-muted-foreground">{log.user_role}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{log.company}</td>
                    <td className="px-4 py-3"><Badge label={action.label} variant={action.variant} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <ResourceIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-foreground">{log.resource}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{log.detail}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.ip}</td>
                    <td className="px-4 py-3">
                      {log.status === 'success'
                        ? <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ OK</span>
                        : <span className="text-xs text-red-500 font-medium">✗ Falhou</span>}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
