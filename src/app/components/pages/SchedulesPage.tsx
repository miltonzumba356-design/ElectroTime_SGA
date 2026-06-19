import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, X, Loader2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { DataTable, type Column } from '../shared/DataTable';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { ActiveBadge } from '../shared/StatusBadge';
import type { Schedule, ScheduleType } from '../lib/types';
import { cn } from '../lib/utils';
import { useSchedules, useCreateSchedule } from '../lib/api-hooks';
import { adaptSchedule, normalizeList } from '../lib/api-adapters';

const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  fixed: 'Fixo', '5x2': '5×2', '6x1': '6×1', '12x36': '12×36', custom: 'Personalizado',
};

const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function SchedulesPage() {
  const { data: rawSchedules, isLoading } = useSchedules();
  const createMut = useCreateSchedule();
  const schedules: Schedule[] = normalizeList(rawSchedules, adaptSchedule);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Schedule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const columns: Column<Schedule>[] = [
    { key: 'name', header: 'Nome da Escala', sortable: true, cell: r => (
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <CalendarDays className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-sm font-medium">{r.name}</span>
      </div>
    )},
    { key: 'type', header: 'Tipo', cell: r => (
      <span className="rounded-md border border-border px-2 py-0.5 text-xs">{SCHEDULE_TYPE_LABELS[r.type]}</span>
    )},
    { key: 'days_of_week', header: 'Dias', cell: r => (
      <div className="flex gap-1">
        {DAYS_SHORT.map((d, i) => (
          <span key={i} className={cn('flex h-6 w-6 items-center justify-center rounded text-[10px] font-medium',
            r.days_of_week.includes(i) ? 'bg-primary/15 text-primary' : 'text-muted-foreground/40'
          )}>{d[0]}</span>
        ))}
      </div>
    )},
    { key: 'timetable_count', header: 'Horários', sortable: true, cell: r => <span className="text-sm">{r.timetable_count}</span> },
    { key: 'employee_count', header: 'Funcionários', sortable: true, cell: r => <span className="text-sm font-medium">{r.employee_count}</span> },
    { key: 'active', header: 'Status', cell: r => <ActiveBadge active={r.active} /> },
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    toast.info('Remoção de escalas deve ser gerida pelo supervisor.');
    setDeleteTarget(null);
    setDeleteLoading(false);
  };

  const onSave = async (formData: any, selectedDays: number[]) => {
    try {
      await createMut.mutateAsync({ nome: formData.name, regime_trabalho: formData.type, dias_semana: selectedDays, ativo: Boolean(formData.active) });
      toast.success('Escala criada com sucesso.');
    } catch {
      toast.error('Erro ao criar escala.');
    }
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Escalas de Trabalho"
        description="Configure os padrões de escala e rotação de turnos"
        actions={
          <button onClick={() => { setEditTarget(null); setDrawerOpen(true); }}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Nova Escala
          </button>
        }
      />
      <DataTable data={schedules} columns={columns} searchFields={['name']}
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
        {drawerOpen && <ScheduleDrawer schedule={editTarget} onClose={() => setDrawerOpen(false)} onSave={onSave} loading={isLoading} />}
      </AnimatePresence>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleteLoading} title="Excluir escala" description={`Excluir "${deleteTarget?.name}"?`} />
    </div>
  );
}

function ScheduleDrawer({ schedule, onClose, onSave, loading }: { schedule: Schedule | null; onClose: () => void; onSave: (data: any, days: number[]) => Promise<void>; loading?: boolean }) {
  const [saving, setSaving] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>(schedule?.days_of_week ?? [1, 2, 3, 4, 5]);
  const { register, handleSubmit } = useForm({ defaultValues: schedule ?? {} });

  const toggleDay = (d: number) => setSelectedDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const onSubmit = async (data: any) => {
    setSaving(true);
    await onSave(data, selectedDays);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative z-10 flex h-full w-full max-w-md flex-col bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">{schedule ? 'Editar Escala' : 'Nova Escala'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-4 px-6 py-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">Nome da Escala</label>
              <input {...register('name')} defaultValue={schedule?.name} placeholder="Comercial Padrão" className={ic()} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">Tipo</label>
              <select {...register('type')} defaultValue={schedule?.type ?? '5x2'} className={ic()}>
                {Object.entries(SCHEDULE_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-3 block text-xs font-medium text-foreground">Dias da Semana</label>
              <div className="flex gap-2">
                {DAYS_SHORT.map((d, i) => (
                  <button key={i} type="button" onClick={() => toggleDay(i)}
                    className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium transition-colors',
                      selectedDays.includes(i)
                        ? 'bg-primary text-white'
                        : 'border border-border text-muted-foreground hover:border-primary/50'
                    )}>{d[0]}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="sched-active" {...register('active')} defaultChecked={schedule?.active ?? true} className="h-4 w-4 accent-primary" />
              <label htmlFor="sched-active" className="text-sm text-foreground">Escala ativa</label>
            </div>
          </div>
          <div className="border-t border-border px-6 py-4 flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {schedule ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

const ic = () => 'h-9 w-full rounded-lg border border-border bg-input-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30';
