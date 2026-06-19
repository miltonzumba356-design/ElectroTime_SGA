import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, X, Loader2, CalendarX, Download } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { StatsCard } from '../shared/StatsCard';
import { DataTable, type Column } from '../shared/DataTable';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { Badge } from '../shared/StatusBadge';
import { useVacations, useCreateVacation, useEmployees } from '../lib/api-hooks';
import { normalizeList, adaptEmployee } from '../lib/api-adapters';
import { formatDate, cn } from '../lib/utils';

type VacAbsType = 'vacation' | 'absence' | 'medical_leave' | 'maternity' | 'other';
type VacAbsStatus = 'active' | 'pending' | 'cancelled';

interface VacAbs {
  id: string;
  employee_id: string;
  employee_name?: string;
  employee_registration?: string;
  department_name?: string;
  type: VacAbsType;
  status: VacAbsStatus;
  start_date: string;
  end_date?: string;
  days: number;
  justification?: string;
  erp_exported: boolean;
  created_by: string;
  created_at: string;
}

const TYPE_MAP: Record<VacAbsType, { label: string; variant: any }> = {
  vacation:     { label: 'Férias', variant: 'info' },
  absence:      { label: 'Falta', variant: 'error' },
  medical_leave:{ label: 'Atestado', variant: 'warning' },
  maternity:    { label: 'Maternidade', variant: 'success' },
  other:        { label: 'Outro', variant: 'neutral' },
};

export function VacationsAbsencesPage() {
  const { data: rawVacations } = useVacations();
  const { data: rawEmployees } = useEmployees();
  const createMut = useCreateVacation();
  const records: VacAbs[] = normalizeList(rawVacations, (v: any): VacAbs => ({
    id: String(v.id ?? ''),
    employee_id: String(v.colaborador_id ?? v.colaborador ?? ''),
    employee_name: v.colaborador_nome ?? v.nome ?? '—',
    employee_registration: v.matricula ?? undefined,
    department_name: v.departamento ?? undefined,
    type: v.tipo ?? 'vacation',
    status: v.status === 'aprovado' ? 'active' : v.status === 'rejeitado' ? 'cancelled' : 'pending',
    start_date: v.data_inicio ?? v.start_date ?? '',
    end_date: v.data_fim ?? v.end_date ?? undefined,
    days: v.dias ?? v.days ?? 0,
    justification: v.motivo ?? v.justificativa ?? undefined,
    erp_exported: v.erp_exportado ?? false,
    created_by: v.criado_por ?? '—',
    created_at: v.criado_em ?? v.created_at ?? new Date().toISOString(),
  }));
  const employees = normalizeList(rawEmployees, adaptEmployee);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<VacAbs | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VacAbs | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<VacAbsType | 'all'>('all');
  const [erpExporting, setErpExporting] = useState(false);

  const filtered = typeFilter === 'all' ? records : records.filter(r => r.type === typeFilter);

  const columns: Column<VacAbs>[] = [
    { key: 'employee_name', header: 'Funcionário', sortable: true,
      cell: r => <div><p className="text-sm font-medium text-foreground">{r.employee_name}</p><p className="text-xs text-muted-foreground">{r.department_name}</p></div> },
    { key: 'type', header: 'Tipo', cell: r => {
      const t = TYPE_MAP[r.type];
      return <Badge label={t.label} variant={t.variant} dot />;
    }},
    { key: 'start_date', header: 'Início', sortable: true, cell: r => <span className="text-sm">{formatDate(r.start_date)}</span> },
    { key: 'end_date', header: 'Fim', cell: r => r.end_date ? <span className="text-sm">{formatDate(r.end_date)}</span> : <span className="text-sm text-muted-foreground">—</span> },
    { key: 'days', header: 'Dias', sortable: true, cell: r => <span className="text-sm font-medium">{r.days}</span> },
    { key: 'erp_exported', header: 'Primavera', cell: r => (
      r.erp_exported
        ? <span className="text-xs text-emerald-600 dark:text-emerald-400">Exportado</span>
        : <span className="text-xs text-amber-600 dark:text-amber-400">Pendente</span>
    )},
  ];

  const handleExportPrimavera = async () => {
    setErpExporting(true);
    toast.info('Exportação para Primavera não disponível via API de momento.');
    setErpExporting(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    toast.info('Eliminação de registos gerida pelo administrador.');
    setDeleteTarget(null);
    setDeleteLoading(false);
  };

  const onSave = async (data: any) => {
    try {
      await createMut.mutateAsync({
        colaborador_id: Number(data.employee_id),
        data_inicio: data.start_date,
        data_fim: data.end_date,
        motivo: data.justification,
      });
      toast.success('Férias registadas com sucesso.');
    } catch {
      toast.error('Erro ao registar férias.');
    }
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Férias e Faltas"
        description="Gestão de férias, faltas e afastamentos — exportação para Primavera"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleExportPrimavera} disabled={erpExporting}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground hover:bg-muted disabled:opacity-60 transition-colors">
              {erpExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Exportar Primavera
            </button>
            <button onClick={() => { setEditTarget(null); setDrawerOpen(true); }}
              className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" /> Novo Registo
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatsCard title="Em Férias" value={records.filter(r => r.type === 'vacation' && r.status === 'active').length} color="blue" delay={0} />
        <StatsCard title="Atestados" value={records.filter(r => r.type === 'medical_leave' && r.status === 'active').length} color="yellow" delay={0.05} />
        <StatsCard title="Faltas" value={records.filter(r => r.type === 'absence').length} color="red" delay={0.1} />
        <StatsCard title="Dias Totais" value={records.reduce((s, r) => s + r.days, 0)} color="slate" delay={0.15} />
      </div>

      <div className="flex flex-wrap gap-2">
        {[{ v: 'all', l: 'Todos' }, ...Object.entries(TYPE_MAP).map(([v, t]) => ({ v, l: t.label }))].map(opt => (
          <button key={opt.v} onClick={() => setTypeFilter(opt.v as any)}
            className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              typeFilter === opt.v ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground hover:border-primary/50')}>
            {opt.l}
          </button>
        ))}
      </div>

      <DataTable data={filtered} columns={columns} searchFields={['employee_name', 'department_name']}
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
        {drawerOpen && <VacAbsDrawer record={editTarget} employees={employees} onClose={() => setDrawerOpen(false)} onSave={onSave} />}
      </AnimatePresence>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleteLoading} title="Eliminar registo" description={`Eliminar este registo de "${deleteTarget?.employee_name}"?`} />
    </div>
  );
}

function VacAbsDrawer({ record, employees, onClose, onSave }: {
  record: VacAbs | null;
  employees: { id: string; name: string; registration: string; status: string }[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit } = useForm({ defaultValues: record ?? {} });

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
          <div>
            <h2 className="text-sm font-semibold text-foreground">{record ? 'Editar Registo' : 'Novo Registo'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Férias criadas pelo RH são aprovadas automaticamente.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-4 px-6 py-5">
            <F l="Funcionário">
              <select {...register('employee_id')} defaultValue={record?.employee_id} className={ic}>
                <option value="">Selecione...</option>
                {employees.filter(e => e.status === 'active').map(e => (
                  <option key={e.id} value={e.id}>{e.name} — {e.registration}</option>
                ))}
              </select>
            </F>
            <F l="Tipo">
              <select {...register('type')} defaultValue={record?.type ?? 'vacation'} className={ic}>
                <option value="vacation">Férias</option>
                <option value="absence">Falta</option>
                <option value="medical_leave">Atestado Médico</option>
                <option value="maternity">Licença Maternidade</option>
                <option value="other">Outro</option>
              </select>
            </F>
            <div className="grid grid-cols-2 gap-3">
              <F l="Data de Início"><input {...register('start_date')} defaultValue={record?.start_date} type="date" className={ic} /></F>
              <F l="Data de Fim"><input {...register('end_date')} defaultValue={record?.end_date} type="date" className={ic} /></F>
            </div>
            <F l="Número de Dias"><input {...register('days')} defaultValue={record?.days ?? 1} type="number" min="1" className={ic} /></F>
            <F l="Justificativa / CID">
              <textarea {...register('justification')} defaultValue={record?.justification} rows={2} placeholder="Motivo ou código CID..."
                className={cn(ic, 'h-auto resize-none py-2')} />
            </F>
          </div>
          <div className="border-t border-border px-6 py-4 flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {record ? 'Guardar' : 'Registar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
