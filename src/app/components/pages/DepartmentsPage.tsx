import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, X, Loader2, Users, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { StatsCard } from '../shared/StatsCard';
import { DataTable, type Column } from '../shared/DataTable';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { ActiveBadge } from '../shared/StatusBadge';
import type { Department } from '../lib/types';
import { formatDate, cn } from '../lib/utils';
import { useAdminDepartments, useDeleteDepartment, useCreateDepartmentCrud, useUpdateDepartment } from '../lib/api-hooks';
import { adaptDepartment, normalizeList } from '../lib/api-adapters';

interface DeptForm {
  name: string;
  code: string;
  manager_name: string;
  active: boolean;
}

export function DepartmentsPage() {
  const { data: rawDepts, isLoading, refetch } = useAdminDepartments();
  const deleteMut  = useDeleteDepartment();
  const createMut  = useCreateDepartmentCrud();
  const updateMut  = useUpdateDepartment();

  const departments: Department[] = normalizeList(rawDepts, adaptDepartment);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const totalEmployees = departments.reduce((s, d) => s + d.employee_count, 0);

  const columns: Column<Department>[] = [
    {
      key: 'code',
      header: 'Código',
      sortable: true,
      width: 'w-24',
      cell: r => <span className="font-mono text-xs text-muted-foreground">{r.code}</span>,
    },
    {
      key: 'name',
      header: 'Departamento',
      sortable: true,
      cell: r => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">{r.name}</span>
        </div>
      ),
    },
    {
      key: 'manager_name',
      header: 'Gestor',
      sortable: true,
      cell: r => <span className="text-sm">{r.manager_name ?? '—'}</span>,
    },
    {
      key: 'employee_count',
      header: 'Funcionários',
      sortable: true,
      cell: r => (
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">{r.employee_count}</span>
        </div>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      cell: r => <ActiveBadge active={r.active} />,
    },
    {
      key: 'created_at',
      header: 'Criado em',
      sortable: true,
      cell: r => <span className="text-sm text-muted-foreground">{formatDate(r.created_at)}</span>,
    },
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteMut.mutateAsync(Number(deleteTarget.id));
      toast.success(`Departamento "${deleteTarget.name}" removido.`);
    } catch {
      toast.error('Erro ao remover departamento.');
    } finally {
      setDeleteTarget(null);
      setDeleteLoading(false);
    }
  };

  const onSave = async (dept: Department) => {
    try {
      const body = { nome: dept.name, codigo: dept.code, responsavel: dept.manager_name, ativo: dept.active };
      if (editTarget) {
        await updateMut.mutateAsync({ id: Number(editTarget.id), body });
        toast.success('Departamento atualizado com sucesso.');
      } else {
        await createMut.mutateAsync(body);
        toast.success('Departamento criado com sucesso.');
      }
    } catch {
      toast.error('Erro ao salvar departamento.');
    }
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departamentos"
        description="Estrutura organizacional da empresa"
        actions={
          <button
            onClick={() => { setEditTarget(null); setDrawerOpen(true); }}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Departamento
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatsCard title="Total de Departamentos" value={departments.length} color="blue" delay={0} />
        <StatsCard title="Funcionários Alocados" value={totalEmployees} color="green" delay={0.05} />
        <StatsCard title="Departamentos Ativos" value={departments.filter(d => d.active).length} color="slate" delay={0.1} />
      </div>

      <DataTable
        data={departments}
        columns={columns}
        searchFields={['name', 'code', 'manager_name']}
        emptyTitle="Nenhum departamento encontrado"
        rowActions={row => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => { setEditTarget(row); setDrawerOpen(true); }}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDeleteTarget(row)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      />

      <AnimatePresence>
        {drawerOpen && (
          <DepartmentDrawer
            department={editTarget}
            onClose={() => setDrawerOpen(false)}
            onSave={onSave}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Excluir departamento"
        description={`Excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}

function DepartmentDrawer({ department, onClose, onSave }: { department: Department | null; onClose: () => void; onSave: (d: Department) => void }) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<DeptForm>({ defaultValues: department ?? {} });

  const onSubmit = async (data: DeptForm) => {
    setSaving(true);
    await onSave({
      id: department?.id ?? '',
      company_id: department?.company_id ?? '',
      employee_count: department?.employee_count ?? 0,
      created_at: department?.created_at ?? new Date().toISOString(),
      ...data,
      active: Boolean(data.active),
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative z-10 flex h-full w-full max-w-md flex-col bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            {department ? 'Editar Departamento' : 'Novo Departamento'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-4 px-6 py-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">Nome do Departamento</label>
              <input {...register('name', { required: 'Obrigatório' })} defaultValue={department?.name}
                placeholder="Recursos Humanos" className={inputCls(!!errors.name)} />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">Código</label>
              <input {...register('code', { required: 'Obrigatório' })} defaultValue={department?.code}
                placeholder="RH" className={inputCls(!!errors.code)} />
              {errors.code && <p className="mt-1 text-xs text-destructive">{errors.code.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">Gestor Responsável</label>
              <input {...register('manager_name')} defaultValue={department?.manager_name}
                placeholder="Nome do gestor" className={inputCls(false)} />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="active" {...register('active')} defaultChecked={department?.active ?? true}
                className="h-4 w-4 rounded border-border accent-primary" />
              <label htmlFor="active" className="text-sm text-foreground">Departamento ativo</label>
            </div>
          </div>
          <div className="border-t border-border px-6 py-4 flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {department ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

const inputCls = (hasError: boolean) =>
  cn(
    'h-9 w-full rounded-lg border bg-input-background px-3 text-sm text-foreground placeholder:text-muted-foreground',
    'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors',
    hasError ? 'border-destructive' : 'border-border'
  );
