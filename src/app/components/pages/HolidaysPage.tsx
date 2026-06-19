import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, X, Loader2, CalendarOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { StatsCard } from '../shared/StatsCard';
import { DataTable, type Column } from '../shared/DataTable';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { Badge } from '../shared/StatusBadge';
import type { Holiday, HolidayType } from '../lib/types';
import { useHolidays, useCreateHoliday, useDeleteHoliday } from '../lib/api-hooks';
import { normalizeList } from '../lib/api-adapters';
import { formatDate, cn } from '../lib/utils';

const TYPE_MAP: Record<HolidayType, { label: string; variant: any }> = {
  national:  { label: 'Nacional', variant: 'info' },
  municipal: { label: 'Municipal', variant: 'default' },
  company:   { label: 'Empresa', variant: 'success' },
};

export function HolidaysPage() {
  const { data: rawHolidays, isLoading } = useHolidays();
  const createMut = useCreateHoliday();
  const deleteMut = useDeleteHoliday();
  const holidays: Holiday[] = normalizeList(rawHolidays, (h: any): Holiday => ({
    id: String(h.id ?? ''),
    name: h.nome ?? h.name ?? '',
    date: h.data ?? h.date ?? '',
    type: h.tipo ?? h.type ?? 'national',
    company_id: String(h.empresa ?? h.company_id ?? ''),
    description: h.descricao ?? h.description ?? undefined,
    recurring: h.recorrente ?? h.recurring ?? false,
    created_at: h.criado_em ?? h.created_at ?? new Date().toISOString(),
  }));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Holiday | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<HolidayType | 'all'>('all');

  const filtered = typeFilter === 'all' ? holidays : holidays.filter(h => h.type === typeFilter);

  const columns: Column<Holiday>[] = [
    { key: 'date', header: 'Data', sortable: true,
      cell: r => <span className="font-medium text-sm">{formatDate(r.date)}</span> },
    { key: 'name', header: 'Feriado', sortable: true,
      cell: r => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
            <CalendarOff className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-medium">{r.name}</span>
        </div>
      ),
    },
    { key: 'type', header: 'Tipo', cell: r => {
      const t = TYPE_MAP[r.type];
      return <Badge label={t.label} variant={t.variant} />;
    }},
    { key: 'recurring', header: 'Recorrente', cell: r => (
      <div className={cn('flex items-center gap-1.5 text-xs font-medium',
        r.recurring ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
        <RefreshCw className="h-3 w-3" />
        {r.recurring ? 'Sim — repete anualmente' : 'Não'}
      </div>
    )},
    { key: 'description', header: 'Descrição', cell: r => (
      <span className="text-sm text-muted-foreground truncate max-w-xs">{r.description ?? '—'}</span>
    )},
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteMut.mutateAsync(Number(deleteTarget.id));
      toast.success(`Feriado "${deleteTarget.name}" removido.`);
    } catch {
      toast.error('Erro ao remover feriado.');
    } finally {
      setDeleteTarget(null);
      setDeleteLoading(false);
    }
  };

  const onSave = async (data: any) => {
    try {
      await createMut.mutateAsync({ nome: data.name, data: data.date, tipo: data.type, descricao: data.description, recorrente: Boolean(data.recurring) });
      toast.success('Feriado registado com sucesso.');
    } catch {
      toast.error('Erro ao registar feriado.');
    }
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feriados"
        description="Gestão de feriados nacionais, municipais e da empresa"
        actions={
          <button onClick={() => { setEditTarget(null); setDrawerOpen(true); }}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Novo Feriado
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatsCard title="Total" value={holidays.length} color="blue" delay={0} />
        <StatsCard title="Nacionais" value={holidays.filter(h => h.type === 'national').length} color="slate" delay={0.05} />
        <StatsCard title="Municipais" value={holidays.filter(h => h.type === 'municipal').length} color="purple" delay={0.1} />
        <StatsCard title="Empresa" value={holidays.filter(h => h.type === 'company').length} color="green" delay={0.15} />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { v: 'all', l: 'Todos' },
          { v: 'national', l: 'Nacionais' },
          { v: 'municipal', l: 'Municipais' },
          { v: 'company', l: 'Empresa' },
        ].map(opt => (
          <button key={opt.v} onClick={() => setTypeFilter(opt.v as any)}
            className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              typeFilter === opt.v ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground hover:border-primary/50')}>
            {opt.l}
          </button>
        ))}
      </div>

      <DataTable data={filtered} columns={columns} searchFields={['name', 'description']}
        emptyTitle="Nenhum feriado encontrado"
        rowActions={row => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => { setEditTarget(row); setDrawerOpen(true); }}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setDeleteTarget(row)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )} />

      <AnimatePresence>
        {drawerOpen && <HolidayDrawer holiday={editTarget} onClose={() => setDrawerOpen(false)} onSave={onSave} />}
      </AnimatePresence>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleteLoading} title="Remover feriado" description={`Remover "${deleteTarget?.name}"?`} />
    </div>
  );
}

function HolidayDrawer({ holiday, onClose, onSave }: { holiday: Holiday | null; onClose: () => void; onSave: (data: any) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit } = useForm({ defaultValues: holiday ?? {} });

  const onSubmit = async (data: any) => {
    setSaving(true);
    await onSave(data);
    setSaving(false);
  };

  const ic = 'h-9 w-full rounded-lg border border-border bg-input-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30';
  const F = ({ l, children }: { l: string; children: React.ReactNode }) => (
    <div><label className="mb-1.5 block text-xs font-medium text-foreground">{l}</label>{children}</div>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative z-10 flex h-full w-full max-w-md flex-col bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">{holiday ? 'Editar Feriado' : 'Novo Feriado'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-4 px-6 py-5">
            <F l="Nome do Feriado"><input {...register('name')} defaultValue={holiday?.name} placeholder="Dia do Trabalho" className={ic} /></F>
            <div className="grid grid-cols-2 gap-3">
              <F l="Data"><input {...register('date')} defaultValue={holiday?.date} type="date" className={ic} /></F>
              <F l="Tipo">
                <select {...register('type')} defaultValue={holiday?.type ?? 'national'} className={ic}>
                  <option value="national">Nacional</option>
                  <option value="municipal">Municipal</option>
                  <option value="company">Empresa</option>
                </select>
              </F>
            </div>
            <F l="Descrição">
              <textarea {...register('description')} defaultValue={holiday?.description} rows={2}
                placeholder="Detalhes sobre este feriado..."
                className={cn(ic, 'h-auto resize-none py-2')} />
            </F>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="h-recurring" {...register('recurring')} defaultChecked={holiday?.recurring ?? true} className="h-4 w-4 accent-primary" />
              <label htmlFor="h-recurring" className="text-sm text-foreground">Feriado recorrente (repete anualmente)</label>
            </div>
          </div>
          <div className="border-t border-border px-6 py-4 flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {holiday ? 'Guardar' : 'Registar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
