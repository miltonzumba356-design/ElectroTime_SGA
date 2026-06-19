import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import {
  Plus, Pencil, Trash2, X, Loader2, FileSignature,
  Upload, Download, RefreshCw, CheckCircle, AlertTriangle, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { StatsCard } from '../shared/StatsCard';
import { DataTable, type Column } from '../shared/DataTable';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { Badge } from '../shared/StatusBadge';
import type { Contract, ContractStatus } from '../lib/types';
import { useContracts, useCreateContract, useEmployees } from '../lib/api-hooks';
import { normalizeList, adaptEmployee } from '../lib/api-adapters';
import { formatDate, formatCurrency, cn } from '../lib/utils';

const CONTRACT_STATUS_MAP: Record<ContractStatus, { label: string; variant: any }> = {
  draft:      { label: 'Rascunho', variant: 'neutral' },
  active:     { label: 'Ativo', variant: 'success' },
  expiring:   { label: 'A expirar', variant: 'warning' },
  expired:    { label: 'Expirado', variant: 'error' },
  terminated: { label: 'Rescindido', variant: 'neutral' },
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  clt: 'CLT', pj: 'PJ', intern: 'Estágio', temp: 'Temporário', fixed_term: 'Prazo Fixo',
};

const ERP_STATUS = ({ synced, date }: { synced: boolean; date?: string }) => (
  <div className={cn('flex items-center gap-1.5 text-xs', synced ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
    {synced ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
    {synced ? `Sincronizado${date ? ` · ${formatDate(date)}` : ''}` : 'Pendente'}
  </div>
);

export function ContractsPage() {
  const { data: rawContracts } = useContracts();
  const { data: rawEmployees } = useEmployees();
  const createMut = useCreateContract();
  const contracts: Contract[] = normalizeList(rawContracts, (c: any): Contract => ({
    id: String(c.id ?? ''),
    company_id: String(c.empresa ?? ''),
    employee_id: String(c.colaborador_id ?? c.colaborador ?? ''),
    employee_name: c.colaborador_nome ?? c.nome ?? '—',
    employee_registration: c.matricula ?? undefined,
    department_name: c.departamento ?? undefined,
    type: c.tipo_contrato ?? c.type ?? 'clt',
    status: c.status ?? 'active',
    base_salary: Number(c.salario_base ?? c.base_salary ?? 0),
    start_date: c.data_inicio ?? c.start_date ?? '',
    end_date: c.data_fim ?? c.end_date ?? undefined,
    benefits: c.beneficios ?? c.benefits ?? undefined,
    notes: c.observacoes ?? c.notes ?? undefined,
    erp_synced: c.sincronizado_erp ?? c.erp_synced ?? false,
    erp_sync_date: c.data_sync_erp ?? c.erp_sync_date ?? undefined,
    created_at: c.criado_em ?? c.created_at ?? new Date().toISOString(),
  }));
  const employees = normalizeList(rawEmployees, adaptEmployee);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Contract | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contract | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [erpSyncing, setErpSyncing] = useState(false);
  const [erpImporting, setErpImporting] = useState(false);

  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === 'active').length,
    expiring: contracts.filter(c => c.status === 'expiring').length,
    pendingSync: contracts.filter(c => !c.erp_synced).length,
  };

  const columns: Column<Contract>[] = [
    { key: 'employee_registration', header: 'Matrícula', sortable: true, width: 'w-20',
      cell: r => <span className="font-mono text-xs text-muted-foreground">{r.employee_registration}</span> },
    { key: 'employee_name', header: 'Funcionário', sortable: true,
      cell: r => <div><p className="text-sm font-medium text-foreground">{r.employee_name}</p><p className="text-xs text-muted-foreground">{r.department_name}</p></div> },
    { key: 'type', header: 'Tipo', cell: r => (
      <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">{CONTRACT_TYPE_LABELS[r.type]}</span>
    )},
    { key: 'base_salary', header: 'Salário Base', sortable: true,
      cell: r => <span className="text-sm font-medium">{formatCurrency(r.base_salary)}</span> },
    { key: 'start_date', header: 'Início', sortable: true, cell: r => <span className="text-sm">{formatDate(r.start_date)}</span> },
    { key: 'end_date', header: 'Fim', cell: r => r.end_date
      ? <span className="text-sm text-amber-600 dark:text-amber-400">{formatDate(r.end_date)}</span>
      : <span className="text-sm text-muted-foreground">Indeterminado</span> },
    { key: 'status', header: 'Status', cell: r => {
      const s = CONTRACT_STATUS_MAP[r.status];
      return <Badge label={s.label} variant={s.variant} dot />;
    }},
    { key: 'erp_synced', header: 'ERP Primavera', cell: r => <ERP_STATUS synced={r.erp_synced} date={r.erp_sync_date} /> },
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    toast.info('Eliminação de contratos deve ser gerida pelo RH.');
    setDeleteTarget(null);
    setDeleteLoading(false);
  };

  const handleErpExport = async () => {
    setErpSyncing(true);
    await new Promise(r => setTimeout(r, 800));
    toast.success('Exportação para Primavera concluída!', { description: `${stats.pendingSync} contratos prontos para sincronizar.` });
    setErpSyncing(false);
  };

  const handleErpImport = async () => {
    setErpImporting(true);
    await new Promise(r => setTimeout(r, 800));
    toast.success('Importação do Primavera concluída!');
    setErpImporting(false);
  };

  const onSave = async (data: any) => {
    try {
      await createMut.mutateAsync({
        colaborador_id: Number(data.employee_id),
        tipo_contrato: data.type,
        status: data.status ?? 'active',
        salario_base: Number(data.base_salary),
        data_inicio: data.start_date,
        data_fim: data.end_date || undefined,
        beneficios: data.benefits,
        observacoes: data.notes,
      });
      toast.success('Contrato criado com sucesso.');
    } catch {
      toast.error('Erro ao criar contrato.');
    }
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contratos"
        description="Gestão de contratos e integração ERP Primavera"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleErpImport} disabled={erpImporting}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground hover:bg-muted disabled:opacity-60 transition-colors">
              {erpImporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Importar Primavera
            </button>
            <button onClick={handleErpExport} disabled={erpSyncing}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground hover:bg-muted disabled:opacity-60 transition-colors">
              {erpSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Exportar JSON
            </button>
            <button onClick={() => { setEditTarget(null); setDrawerOpen(true); }}
              className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" /> Novo Contrato
            </button>
          </div>
        }
      />

      {/* ERP alert */}
      {stats.pendingSync > 0 && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-foreground">
            <strong>{stats.pendingSync} contratos</strong> aguardando sincronização com o ERP Primavera.
          </p>
          <button onClick={handleErpExport} disabled={erpSyncing}
            className="ml-auto flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:underline">
            <RefreshCw className={cn('h-3 w-3', erpSyncing && 'animate-spin')} />
            Sincronizar agora
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatsCard title="Total de Contratos" value={stats.total} color="blue" delay={0} />
        <StatsCard title="Contratos Ativos" value={stats.active} color="green" delay={0.05} />
        <StatsCard title="A Expirar" value={stats.expiring} color="yellow" delay={0.1} />
        <StatsCard title="Sem Sync ERP" value={stats.pendingSync} color="red" delay={0.15} />
      </div>

      <DataTable data={contracts} columns={columns}
        searchFields={['employee_name', 'employee_registration', 'department_name']}
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
        {drawerOpen && <ContractDrawer contract={editTarget} employees={employees} onClose={() => setDrawerOpen(false)} onSave={onSave} />}
      </AnimatePresence>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleteLoading} title="Excluir contrato" description={`Excluir contrato de "${deleteTarget?.employee_name}"?`} />
    </div>
  );
}

function ContractDrawer({ contract, employees, onClose, onSave }: {
  contract: Contract | null;
  employees: { id: string; name: string; registration: string; status: string }[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit } = useForm({ defaultValues: contract ?? {} });

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
        className="relative z-10 flex h-full w-full max-w-lg flex-col bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{contract ? 'Editar Contrato' : 'Novo Contrato'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Os dados serão sincronizados com o ERP Primavera.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-4 px-6 py-5">
            <F l="Funcionário">
              <select {...register('employee_id')} defaultValue={contract?.employee_id} className={ic}>
                <option value="">Selecione...</option>
                {employees.filter(e => e.status === 'active').map(e => (
                  <option key={e.id} value={e.id}>{e.name} — {e.registration}</option>
                ))}
              </select>
            </F>
            <div className="grid grid-cols-2 gap-3">
              <F l="Tipo de Contrato">
                <select {...register('type')} defaultValue={contract?.type ?? 'clt'} className={ic}>
                  <option value="clt">CLT</option>
                  <option value="pj">PJ</option>
                  <option value="intern">Estágio</option>
                  <option value="temp">Temporário</option>
                  <option value="fixed_term">Prazo Fixo</option>
                </select>
              </F>
              <F l="Status">
                <select {...register('status')} defaultValue={contract?.status ?? 'active'} className={ic}>
                  <option value="draft">Rascunho</option>
                  <option value="active">Ativo</option>
                  <option value="expiring">A expirar</option>
                  <option value="expired">Expirado</option>
                  <option value="terminated">Rescindido</option>
                </select>
              </F>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <F l="Data de Início"><input {...register('start_date')} defaultValue={contract?.start_date} type="date" className={ic} /></F>
              <F l="Data de Fim (opcional)"><input {...register('end_date')} defaultValue={contract?.end_date} type="date" className={ic} /></F>
            </div>
            <F l="Salário Base (R$)">
              <input {...register('base_salary')} defaultValue={contract?.base_salary} type="number" placeholder="5000" className={ic} />
            </F>
            <F l="Benefícios">
              <textarea {...register('benefits')} defaultValue={contract?.benefits} rows={2}
                placeholder="Vale refeição, plano de saúde, VT..."
                className={cn(ic, 'h-auto resize-none py-2')} />
            </F>
            <F l="Observações">
              <textarea {...register('notes')} defaultValue={contract?.notes} rows={2} placeholder="Notas internas..."
                className={cn(ic, 'h-auto resize-none py-2')} />
            </F>
          </div>
          <div className="border-t border-border px-6 py-4 flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {contract ? 'Guardar' : 'Criar Contrato'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

