import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, X, Loader2, CheckSquare, AlertTriangle, Circle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { StatsCard } from '../shared/StatsCard';
import { DataTable, type Column } from '../shared/DataTable';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { Badge } from '../shared/StatusBadge';
import type { Task, TaskStatus, TaskPriority } from '../lib/types';
import { useEmployees, useAssignTasks } from '../lib/api-hooks';
import { normalizeList, adaptEmployee } from '../lib/api-adapters';
import { formatDate, cn } from '../lib/utils';

const STATUS_MAP: Record<TaskStatus, { label: string; variant: any; icon: typeof Circle }> = {
  pending:    { label: 'Pendente', variant: 'neutral',  icon: Circle },
  in_progress:{ label: 'Em Progresso', variant: 'warning', icon: Loader2 },
  completed:  { label: 'Concluída', variant: 'success', icon: CheckCircle2 },
  cancelled:  { label: 'Cancelada', variant: 'error', icon: X as any },
};

const PRIORITY_MAP: Record<TaskPriority, { label: string; variant: any; dot: string }> = {
  low:      { label: 'Baixa', variant: 'neutral', dot: 'bg-slate-400' },
  medium:   { label: 'Média', variant: 'info',    dot: 'bg-blue-500' },
  high:     { label: 'Alta',  variant: 'warning', dot: 'bg-amber-500' },
  critical: { label: 'Crítica', variant: 'error', dot: 'bg-red-500' },
};

export function TasksPage() {
  const { data: rawEmployees } = useEmployees();
  const employees = normalizeList(rawEmployees, adaptEmployee);
  const assignMut = useAssignTasks();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');

  const filtered = statusFilter === 'all' ? tasks : tasks.filter(t => t.status === statusFilter);

  const columns: Column<Task>[] = [
    { key: 'priority', header: 'Prioridade', cell: r => {
      const p = PRIORITY_MAP[r.priority];
      return <div className="flex items-center gap-1.5"><span className={cn('h-2 w-2 rounded-full', p.dot)} /><span className="text-xs text-muted-foreground">{p.label}</span></div>;
    }},
    { key: 'title', header: 'Tarefa', sortable: true,
      cell: r => <div><p className="text-sm font-medium text-foreground">{r.title}</p><p className="text-xs text-muted-foreground truncate max-w-xs">{r.description}</p></div> },
    { key: 'assigned_to_name', header: 'Atribuído a', sortable: true,
      cell: r => <div className="flex items-center gap-1.5"><div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">{r.assigned_to_name?.split(' ').map(n => n[0]).slice(0, 2).join('')}</div><span className="text-sm">{r.assigned_to_name}</span></div> },
    { key: 'due_date', header: 'Prazo', sortable: true,
      cell: r => r.due_date
        ? <span className={cn('text-sm', new Date(r.due_date) < new Date() && r.status !== 'completed' ? 'text-red-500 font-medium' : '')}>{formatDate(r.due_date)}</span>
        : <span className="text-muted-foreground">—</span> },
    { key: 'status', header: 'Status', cell: r => {
      const s = STATUS_MAP[r.status];
      return <Badge label={s.label} variant={s.variant} dot />;
    }},
  ];

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status, completed_at: status === 'completed' ? new Date().toISOString() : undefined } : t));
    if (status === 'completed') toast.success('Tarefa concluída!');
    else toast('Status atualizado.');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await new Promise(r => setTimeout(r, 700));
    setTasks(prev => prev.filter(t => t.id !== deleteTarget.id));
    toast.success('Tarefa removida.');
    setDeleteTarget(null);
    setDeleteLoading(false);
  };

  const onSave = async (t: Task) => {
    if (editTarget) {
      setTasks(prev => prev.map(x => x.id === t.id ? t : x));
      toast.success('Tarefa atualizada.');
    } else {
      try {
        const priority = t.priority === 'low' ? 'baixa' : t.priority === 'high' ? 'alta' : 'média';
        await assignMut.mutateAsync({
          colaborador_id: Number(t.assigned_to_id),
          titulo: t.title,
          descricao: t.description ?? '',
          prazo: t.due_date,
          prioridade: priority,
        });
        setTasks(prev => [t, ...prev]);
        toast.success('Tarefa atribuída com sucesso.');
      } catch {
        setTasks(prev => [t, ...prev]);
        toast.success('Tarefa criada localmente.');
      }
    }
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tarefas da Equipa"
        description="Atribua e acompanhe tarefas dos colaboradores"
        actions={
          <button onClick={() => { setEditTarget(null); setDrawerOpen(true); }}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Nova Tarefa
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatsCard title="Total" value={tasks.length} color="blue" delay={0} />
        <StatsCard title="Pendentes" value={tasks.filter(t => t.status === 'pending').length} color="yellow" delay={0.05} />
        <StatsCard title="Em Progresso" value={tasks.filter(t => t.status === 'in_progress').length} color="slate" delay={0.1} />
        <StatsCard title="Concluídas" value={tasks.filter(t => t.status === 'completed').length} color="green" delay={0.15} />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { v: 'all', l: 'Todas' },
          { v: 'pending', l: 'Pendentes' },
          { v: 'in_progress', l: 'Em Progresso' },
          { v: 'completed', l: 'Concluídas' },
        ].map(opt => (
          <button key={opt.v} onClick={() => setStatusFilter(opt.v as any)}
            className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              statusFilter === opt.v ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground hover:border-primary/50')}>
            {opt.l}
          </button>
        ))}
      </div>

      <DataTable data={filtered} columns={columns}
        searchFields={['title', 'assigned_to_name', 'description']}
        rowActions={row => (
          <div className="flex items-center justify-end gap-1">
            {row.status !== 'completed' && (
              <button onClick={() => handleStatusChange(row.id, 'completed')} title="Marcar como concluída"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors">
                <CheckSquare className="h-3.5 w-3.5" />
              </button>
            )}
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
        {drawerOpen && <TaskDrawer task={editTarget} employees={employees} onClose={() => setDrawerOpen(false)} onSave={onSave} />}
      </AnimatePresence>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleteLoading} title="Excluir tarefa" description={`Excluir "${deleteTarget?.title}"?`} />
    </div>
  );
}

function TaskDrawer({ task, employees, onClose, onSave }: {
  task: Task | null;
  employees: { id: string; name: string; status: string; department_name?: string }[];
  onClose: () => void;
  onSave: (t: Task) => void;
}) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit } = useForm({ defaultValues: task ?? {} });

  const onSubmit = async (data: any) => {
    setSaving(true);
    const emp = employees.find(e => e.id === data.assigned_to_id);
    onSave({
      id: task?.id ?? `tk-${Date.now()}`,
      company_id: '',
      supervisor_id: '',
      supervisor_name: '',
      created_at: task?.created_at ?? new Date().toISOString(),
      ...data,
      assigned_to_name: emp?.name,
      department_name: emp?.department_name,
    });
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
          <h2 className="text-sm font-semibold text-foreground">{task ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-4 px-6 py-5">
            <F l="Título"><input {...register('title')} defaultValue={task?.title} placeholder="Verificar EPI da Linha A" className={ic} /></F>
            <F l="Descrição">
              <textarea {...register('description')} defaultValue={task?.description} rows={3} placeholder="Detalhes da tarefa..."
                className={cn(ic, 'h-auto resize-none py-2')} />
            </F>
            <F l="Atribuir a">
              <select {...register('assigned_to_id')} defaultValue={task?.assigned_to_id} className={ic}>
                <option value="">Selecione...</option>
                {employees.filter(e => e.status === 'active').map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </F>
            <div className="grid grid-cols-2 gap-3">
              <F l="Prioridade">
                <select {...register('priority')} defaultValue={task?.priority ?? 'medium'} className={ic}>
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </F>
              <F l="Status">
                <select {...register('status')} defaultValue={task?.status ?? 'pending'} className={ic}>
                  <option value="pending">Pendente</option>
                  <option value="in_progress">Em Progresso</option>
                  <option value="completed">Concluída</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </F>
            </div>
            <F l="Prazo"><input {...register('due_date')} defaultValue={task?.due_date} type="date" className={ic} /></F>
          </div>
          <div className="border-t border-border px-6 py-4 flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {task ? 'Guardar' : 'Criar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
