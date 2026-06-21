import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle, CheckCircle, XCircle, MapPin, Clock,
  Eye, X, Loader2, Navigation,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { StatsCard } from '../shared/StatsCard';
import { Badge } from '../shared/StatusBadge';
import { GeoMap } from '../shared/GeoMap';
import type { PresenceAuth } from '../lib/types';
import { usePendingPresences, useAuthorizePresence } from '../lib/api-hooks';
import { normalizeList } from '../lib/api-adapters';
import { formatDate, cn } from '../lib/utils';

const STATUS_MAP = {
  pending:    { label: 'Pendente', variant: 'warning' as const },
  authorized: { label: 'Autorizado', variant: 'success' as const },
  rejected:   { label: 'Rejeitado', variant: 'error' as const },
};

export function GeofencingAuthPage() {
  const { data: rawPresences } = usePendingPresences();
  const authorizeMut = useAuthorizePresence();
  const auths: PresenceAuth[] = normalizeList(rawPresences, (a: any): PresenceAuth => ({
    id: String(a.id ?? ''),
    company_id: String(a.empresa ?? ''),
    employee_id: String(a.colaborador_id ?? a.colaborador ?? ''),
    employee_name: a.colaborador_nome ?? a.nome ?? '—',
    department_name: a.departamento ?? undefined,
    date: a.data ?? a.date ?? '',
    entry_time: a.hora_entrada ?? a.entry_time ?? '',
    latitude: a.latitude ?? 0,
    longitude: a.longitude ?? 0,
    post_id: String(a.posto_id ?? ''),
    distance_from_post_meters: a.distancia_metros ?? a.distance_from_post_meters ?? undefined,
    location_name: a.localizacao ?? a.location_name ?? undefined,
    reason: a.justificativa ?? a.reason ?? '',
    status: a.status === 'autorizado' ? 'authorized' : a.status === 'rejeitado' ? 'rejected' : 'pending',
    supervisor_name: a.supervisor ?? a.supervisor_name ?? undefined,
    reviewed_at: a.revisado_em ?? a.reviewed_at ?? undefined,
    created_at: a.criado_em ?? a.created_at ?? new Date().toISOString(),
  }));
  const [viewTarget, setViewTarget] = useState<PresenceAuth | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'authorized' | 'rejected'>('all');

  const pending = auths.filter(a => a.status === 'pending');
  const filtered = filterStatus === 'all' ? auths : auths.filter(a => a.status === filterStatus);

  const handleReview = async (id: string, action: 'authorized' | 'rejected') => {
    setLoading(id);
    try {
      await authorizeMut.mutateAsync({ id: Number(id), action: action === 'authorized' ? 'autorizar' : 'rejeitar' });
      toast[action === 'authorized' ? 'success' : 'error'](
        action === 'authorized' ? 'Presença autorizada com sucesso.' : 'Presença rejeitada.',
        { description: 'O colaborador foi notificado.' }
      );
    } catch {
      toast.error('Erro ao processar autorização.');
    }
    setLoading(null);
    if (viewTarget?.id === id) setViewTarget(null);
  };

  const distanceColor = (m?: number) => {
    if (!m) return 'text-muted-foreground';
    if (m < 500) return 'text-emerald-600 dark:text-emerald-400';
    if (m < 1500) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Presenças Pendentes"
        description="Autorizações de ponto fora do geofencing — fila crítica"
        badge={
          pending.length > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
              {pending.length}
            </span>
          ) : undefined
        }
      />

      {/* Critical alert */}
      {pending.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3.5">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-foreground">
            <strong>{pending.length} colaborador{pending.length > 1 ? 'es' : ''}</strong> registou ponto fora do perímetro autorizado e aguarda{pending.length === 1 ? '' : 'm'} autorização.
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatsCard title="Pendentes" value={pending.length} color="yellow" delay={0} />
        <StatsCard title="Autorizados Hoje" value={auths.filter(a => a.status === 'authorized').length} color="green" delay={0.05} />
        <StatsCard title="Rejeitados" value={auths.filter(a => a.status === 'rejected').length} color="red" delay={0.1} />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { v: 'all', l: 'Todos' },
          { v: 'pending', l: `Pendentes (${pending.length})` },
          { v: 'authorized', l: 'Autorizados' },
          { v: 'rejected', l: 'Rejeitados' },
        ].map(opt => (
          <button key={opt.v} onClick={() => setFilterStatus(opt.v as any)}
            className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              filterStatus === opt.v
                ? opt.v === 'pending' ? 'border-amber-500 bg-amber-500 text-white' : 'border-primary bg-primary text-white'
                : 'border-border text-muted-foreground hover:border-primary/50')}>
            {opt.l}
          </button>
        ))}
      </div>

      {/* Cards view */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500 mb-3" />
            <p className="text-sm font-semibold text-foreground">Tudo em ordem!</p>
            <p className="text-xs text-muted-foreground mt-1">Não há presenças pendentes de autorização.</p>
          </div>
        )}

        {filtered.map((auth, i) => (
          <motion.div
            key={auth.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={cn(
              'rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm',
              auth.status === 'pending' ? 'border-amber-500/30 bg-amber-500/3' : 'border-border'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {auth.employee_name?.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{auth.employee_name}</p>
                    <p className="text-xs text-muted-foreground">{auth.department_name}</p>
                  </div>
                  <Badge label={STATUS_MAP[auth.status].label} variant={STATUS_MAP[auth.status].variant} dot />
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <span>{formatDate(auth.date)} às {auth.entry_time}</span>
                  </div>
                  <div className={cn('flex items-center gap-1.5', distanceColor(auth.distance_from_post_meters))}>
                    <Navigation className="h-3 w-3 flex-shrink-0" />
                    <span>{auth.distance_from_post_meters ? `${auth.distance_from_post_meters}m do posto` : '—'}</span>
                  </div>
                  {auth.location_name && (
                    <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{auth.location_name}</span>
                    </div>
                  )}
                </div>

                <p className="mt-2 text-xs text-foreground bg-muted/50 rounded-lg px-3 py-2 leading-relaxed">
                  "{auth.reason}"
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <button onClick={() => setViewTarget(auth)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Eye className="h-3 w-3" /> Ver detalhes
                  </button>

                  {auth.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleReview(auth.id, 'rejected')} disabled={!!loading}
                        className="flex h-7 items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-xs font-medium text-red-600 hover:bg-red-500/20 disabled:opacity-50 transition-colors">
                        {loading === auth.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                        Rejeitar
                      </button>
                      <button onClick={() => handleReview(auth.id, 'authorized')} disabled={!!loading}
                        className="flex h-7 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors">
                        {loading === auth.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                        Autorizar
                      </button>
                    </div>
                  )}

                  {auth.status !== 'pending' && (
                    <p className="text-xs text-muted-foreground">
                      {auth.status === 'authorized' ? '✓' : '✗'} {auth.supervisor_name} · {auth.reviewed_at ? formatDate(auth.reviewed_at) : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {viewTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewTarget(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="text-sm font-semibold text-foreground">Detalhe de Presença</h2>
                <button onClick={() => setViewTarget(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    ['Colaborador', viewTarget.employee_name ?? '—'],
                    ['Departamento', viewTarget.department_name ?? '—'],
                    ['Data', formatDate(viewTarget.date)],
                    ['Hora de Entrada', viewTarget.entry_time ?? '—'],
                    ['Localização', viewTarget.location_name ?? '—'],
                    ['Distância do Posto', viewTarget.distance_from_post_meters ? `${viewTarget.distance_from_post_meters}m` : '—'],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-medium text-foreground mt-0.5">{val}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <GeoMap
                    latitude={viewTarget.latitude}
                    longitude={viewTarget.longitude}
                    label={viewTarget.employee_name ?? 'Presença fora do perímetro'}
                    address={viewTarget.location_name}
                    heightClassName="h-48"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Justificativa do colaborador</p>
                  <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3 leading-relaxed">{viewTarget.reason}</p>
                </div>
                {viewTarget.status === 'pending' && (
                  <div className="flex gap-2.5">
                    <button onClick={() => handleReview(viewTarget.id, 'rejected')} disabled={!!loading}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 py-2.5 text-sm font-medium text-red-600 hover:bg-red-500/20 disabled:opacity-50">
                      <XCircle className="h-4 w-4" /> Rejeitar
                    </button>
                    <button onClick={() => handleReview(viewTarget.id, 'authorized')} disabled={!!loading}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
                      {loading === viewTarget.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      Autorizar
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
