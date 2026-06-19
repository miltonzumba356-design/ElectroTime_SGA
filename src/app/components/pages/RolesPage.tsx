import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { DataTable, type Column } from '../shared/DataTable';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { ActiveBadge } from '../shared/StatusBadge';
import type { Role } from '../lib/types';
import { formatCurrency, cn } from '../lib/utils';
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole, useAdminDepartments } from '../lib/api-hooks';
import { normalizeList } from '../lib/api-adapters';

export function RolesPage() {
  const { data: rawRoles, isLoading } = useRoles();
  const { data: rawDepts } = useAdminDepartments();
  const createMut = useCreateRole();
  const updateMut = useUpdateRole();
  const deleteMut = useDeleteRole();

  const roles: Role[] = normalizeList(rawRoles, (r: any): Role => ({
    id: String(r.id ?? ''),
    name: r.tipo_role_display ?? r.nome ?? r.name ?? '',
    code: r.tipo_role ?? r.codigo ?? r.code ?? '',
    company_id: String(r.empresa ?? r.company_id ?? ''),
    department_id: r.departamento_id ? String(r.departamento_id) : undefined,
    department_name: r.departamento ?? r.department_name ?? undefined,
    cbo: r.cbo ?? undefined,
    salary_min: r.salario_min ?? r.salary_min ?? undefined,
    salary_max: r.salario_max ?? r.salary_max ?? undefined,
    active: r.ativo ?? r.active ?? true,
    employee_count: r.total_colaboradores ?? r.employee_count ?? 0,
    created_at: r.criado_em ?? r.created_at ?? new Date().toISOString(),
  }));

  const departments = normalizeList(rawDepts, (d: any) => ({ id: String(d.id), name: d.nome ?? d.name ?? '' }));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const columns: Column<Role>[] = [
    { key: 'code', header: 'Código', sortable: true, width: 'w-24', cell: r => <span className="font-mono text-xs text-muted-foreground">{r.code}</span> },
    { key: 'name', header: 'Cargo', sortable: true, cell: r => <span className="text-sm font-medium">{r.name}</span> },
    { key: 'department_name', header: 'Departamento', sortable: true, cell: r => <span className="text-sm">{r.department_name ?? '—'}</span> },
    { key: 'cbo', header: 'CBO', cell: r => <span className="font-mono text-xs text-muted-foreground">{r.cbo ?? '—'}</span> },
    {
      key: 'salary_min',
      header: 'Faixa Salarial',
      cell: r => r.salary_min ? (
        <span className="text-sm">{formatCurrency(r.salary_min)} — {formatCurrency(r.salary_max ?? r.salary_min)}</span>
      ) : <span className="text-muted-foreground">—</span>,
    },
    { key: 'employee_count', header: 'Funcionários', sortable: true, cell: r => <span className="text-sm font-medium">{r.employee_count}</span> },
    { key: 'active', header: 'Status', cell: r => <ActiveBadge active={r.active} /> },
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteMut.mutateAsync(Number(deleteTarget.id));
      toast.success(`Cargo "${deleteTarget.name}" removido.`);
    } catch {
      toast.error('Erro ao remover cargo.');
    } finally {
      setDeleteTarget(null);
      setDeleteLoading(false);
    }
  };

  const onSave = async (role: Role) => {
    try {
      const body = { tipo_role: role.code, ativo: role.active };
      if (editTarget) {
        await updateMut.mutateAsync({ id: Number(editTarget.id), body });
        toast.success('Cargo atualizado.');
      } else {
        await createMut.mutateAsync(body);
        toast.success('Cargo criado com sucesso.');
      }
    } catch {
      toast.error('Erro ao salvar cargo.');
    }
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cargos"
        description="Estrutura de cargos e funções da empresa"
        actions={
          <button onClick={() => { setEditTarget(null); setDrawerOpen(true); }}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Novo Cargo
          </button>
        }
      />
      <DataTable
        data={roles}
        columns={columns}
        searchFields={['name', 'code', 'department_name']}
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
        )}
      />
      <AnimatePresence>
        {drawerOpen && <RoleDrawer role={editTarget} departments={departments} onClose={() => setDrawerOpen(false)} onSave={onSave} />}
      </AnimatePresence>
      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleteLoading}
        title="Excluir cargo" description={`Excluir "${deleteTarget?.name}"?`}
      />
    </div>
  );
}

function RoleDrawer({ role, departments, onClose, onSave }: {
  role: Role | null;
  departments: { id: string; name: string }[];
  onClose: () => void;
  onSave: (r: Role) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit } = useForm({ defaultValues: role ?? {} });

  const onSubmit = async (data: any) => {
    setSaving(true);
    const dept = departments.find(d => d.id === data.department_id);
    await onSave({
      id: role?.id ?? '',
      company_id: '',
      employee_count: role?.employee_count ?? 0,
      created_at: role?.created_at ?? new Date().toISOString(),
      active: Boolean(data.active),
      ...data,
      department_name: dept?.name,
      salary_min: data.salary_min ? Number(data.salary_min) : undefined,
      salary_max: data.salary_max ? Number(data.salary_max) : undefined,
    });
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
          <h2 className="text-sm font-semibold text-foreground">{role ? 'Editar Cargo' : 'Novo Cargo'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-4 px-6 py-5">
            <Field label="Nome do Cargo"><input {...register('name')} defaultValue={role?.name} placeholder="Analista de RH" className={ic()} /></Field>
            <Field label="Código"><input {...register('code')} defaultValue={role?.code} placeholder="ARH" className={ic()} /></Field>
            <Field label="Departamento">
              <select {...register('department_id')} defaultValue={role?.department_id} className={ic()}>
                <option value="">Selecione...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="CBO"><input {...register('cbo')} defaultValue={role?.cbo} placeholder="2521-05" className={ic()} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Salário Mínimo"><input {...register('salary_min')} defaultValue={role?.salary_min} type="number" placeholder="3500" className={ic()} /></Field>
              <Field label="Salário Máximo"><input {...register('salary_max')} defaultValue={role?.salary_max} type="number" placeholder="6000" className={ic()} /></Field>
            </div>
            <Field label="Descrição">
              <textarea {...register('description')} defaultValue={role?.description} rows={3} placeholder="Descrição do cargo..."
                className={cn(ic(), 'h-auto resize-none py-2')} />
            </Field>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="active-r" {...register('active')} defaultChecked={role?.active ?? true} className="h-4 w-4 accent-primary" />
              <label htmlFor="active-r" className="text-sm text-foreground">Cargo ativo</label>
            </div>
          </div>
          <div className="border-t border-border px-6 py-4 flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {role ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="mb-1.5 block text-xs font-medium text-foreground">{label}</label>
    {children}
  </div>
);

const ic = () => 'h-9 w-full rounded-lg border border-border bg-input-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30';
