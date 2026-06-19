import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, X, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { DataTable, type Column } from '../shared/DataTable';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { ActiveBadge } from '../shared/StatusBadge';
import type { Timetable } from '../lib/types';
import { cn } from '../lib/utils';
import { useTurnos, useCreateTurno, useSchedules } from '../lib/api-hooks';
import { adaptTimetable, adaptSchedule, normalizeList } from '../lib/api-adapters';

export function TimetablesPage() {
  const { data: rawTimetables, isLoading } = useTurnos();
  const { data: rawSchedules } = useSchedules();
  const createMut = useCreateTurno();
  const timetables: Timetable[] = normalizeList(rawTimetables, adaptTimetable);
  const schedules = normalizeList(rawSchedules, adaptSchedule);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Timetable | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Timetable | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const columns: Column<Timetable>[] = [
    { key: 'name', header: 'Horário', sortable: true, cell: r => (
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Clock className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-sm font-medium">{r.name}</span>
      </div>
    )},
    { key: 'schedule_name', header: 'Escala', sortable: true, cell: r => <span className="text-sm">{r.schedule_name ?? '—'}</span> },
    { key: 'entry_time', header: 'Entrada', sortable: true, cell: r => <span className="font-mono text-sm">{r.entry_time}</span> },
    { key: 'exit_time', header: 'Saída', cell: r => <span className="font-mono text-sm">{r.exit_time}</span> },
    { key: 'total_hours', header: 'Total/dia', cell: r => <span className="text-sm">{r.total_hours}h</span> },
    { key: 'tolerance_entry', header: 'Tolerância', cell: r => <span className="text-sm text-muted-foreground">{r.tolerance_entry} min</span> },
    { key: 'active', header: 'Status', cell: r => <ActiveBadge active={r.active} /> },
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    toast.info('Remoção de horários deve ser gerida pelo supervisor.');
    setDeleteTarget(null);
    setDeleteLoading(false);
  };

  const onSave = async (data: any) => {
    try {
      await createMut.mutateAsync({
        nome: data.name,
        horario_entrada: data.entry_time,
        horario_saida: data.exit_time,
        horario_almoco_inicio: data.break_start,
        horario_almoco_fim: data.break_end,
        tolerancia_entrada: Number(data.tolerance_entry) || 10,
        tolerancia_saida: Number(data.tolerance_exit) || 5,
        carga_horaria: Number(data.total_hours) || 8,
        ativo: Boolean(data.active),
        escala_id: data.schedule_id ? Number(data.schedule_id) : undefined,
      });
      toast.success('Horário criado com sucesso.');
    } catch {
      toast.error('Erro ao criar horário.');
    }
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Horários de Trabalho"
        description="Defina os horários de entrada, saída e intervalos"
        actions={
          <button onClick={() => { setEditTarget(null); setDrawerOpen(true); }}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Novo Horário
          </button>
        }
      />
      <DataTable data={timetables} columns={columns} searchFields={['name', 'schedule_name']}
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
        {drawerOpen && <TimetableDrawer timetable={editTarget} schedules={schedules} onClose={() => setDrawerOpen(false)} onSave={onSave} />}
      </AnimatePresence>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleteLoading} title="Excluir horário" description={`Excluir "${deleteTarget?.name}"?`} />
    </div>
  );
}

function TimetableDrawer({ timetable, schedules, onClose, onSave }: {
  timetable: Timetable | null;
  schedules: { id: string; name: string }[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit } = useForm({ defaultValues: timetable ?? {} });

  const onSubmit = async (data: any) => {
    setSaving(true);
    await onSave(data);
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
          <h2 className="text-sm font-semibold text-foreground">{timetable ? 'Editar Horário' : 'Novo Horário'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-4 px-6 py-5">
            <F label="Nome"><input {...register('name')} defaultValue={timetable?.name} placeholder="Horário Comercial — Manhã" className={ic()} /></F>
            <F label="Escala Vinculada">
              <select {...register('schedule_id')} defaultValue={timetable?.schedule_id} className={ic()}>
                <option value="">Selecione...</option>
                {schedules.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </F>
            <div className="grid grid-cols-2 gap-3">
              <F label="Entrada"><input {...register('entry_time')} defaultValue={timetable?.entry_time} type="time" className={ic()} /></F>
              <F label="Saída"><input {...register('exit_time')} defaultValue={timetable?.exit_time} type="time" className={ic()} /></F>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <F label="Início Intervalo"><input {...register('break_start')} defaultValue={timetable?.break_start} type="time" className={ic()} /></F>
              <F label="Fim Intervalo"><input {...register('break_end')} defaultValue={timetable?.break_end} type="time" className={ic()} /></F>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <F label="Tolerância Entrada (min)"><input {...register('tolerance_entry')} defaultValue={timetable?.tolerance_entry ?? 10} type="number" className={ic()} /></F>
              <F label="Tolerância Saída (min)"><input {...register('tolerance_exit')} defaultValue={timetable?.tolerance_exit ?? 5} type="number" className={ic()} /></F>
            </div>
            <F label="Total de Horas/dia"><input {...register('total_hours')} defaultValue={timetable?.total_hours ?? 8} type="number" step="0.5" className={ic()} /></F>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="tt-active" {...register('active')} defaultChecked={timetable?.active ?? true} className="h-4 w-4 accent-primary" />
              <label htmlFor="tt-active" className="text-sm text-foreground">Horário ativo</label>
            </div>
          </div>
          <div className="border-t border-border px-6 py-4 flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {timetable ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label className="mb-1.5 block text-xs font-medium text-foreground">{label}</label>{children}</div>
);
const ic = () => 'h-9 w-full rounded-lg border border-border bg-input-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30';
