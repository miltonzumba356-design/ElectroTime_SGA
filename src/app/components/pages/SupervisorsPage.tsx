import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, X, Loader2, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { DataTable, type Column } from '../shared/DataTable';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { ActiveBadge } from '../shared/StatusBadge';
import type { Supervisor } from '../lib/types';
import { formatPhone, getInitials, cn } from '../lib/utils';
import { useAdminSupervisors, useCreateSupervisor, useAdminDepartments } from '../lib/api-hooks';
import { adaptSupervisor, normalizeList } from '../lib/api-adapters';

export function SupervisorsPage() {
  const { data: rawSups, isLoading } = useAdminSupervisors();
  const { data: rawDepts } = useAdminDepartments();
  const createMut = useCreateSupervisor();

  const supervisors: Supervisor[] = normalizeList(rawSups, adaptSupervisor);
  const departments = normalizeList(rawDepts, (d: any) => ({ id: String(d.id), name: d.nome ?? d.name ?? '' }));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Supervisor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supervisor | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const columns: Column<Supervisor>[] = [
    { key: 'name', header: 'Supervisor', sortable: true,
      cell: r => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-xs font-semibold text-violet-600">
            {getInitials(r.name)}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{r.name}</p>
            <p className="text-xs text-muted-foreground">{r.email}</p>
          </div>
        </div>
      )
    },
    { key: 'department_name', header: 'Departamento', sortable: true, cell: r => <span className="text-sm">{r.department_name ?? '—'}</span> },
    { key: 'role_name', header: 'Função', cell: r => <span className="text-sm text-muted-foreground">{r.role_name ?? '—'}</span> },
    { key: 'phone', header: 'Telefone', cell: r => <span className="text-sm">{formatPhone(r.phone)}</span> },
    { key: 'employee_count', header: 'Subordinados', sortable: true, cell: r => <span className="text-sm font-medium">{r.employee_count}</span> },
    { key: 'active', header: 'Status', cell: r => <ActiveBadge active={r.active} /> },
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    toast.info('Remoção de supervisores deve ser gerida pelo administrador.');
    setDeleteTarget(null);
    setDeleteLoading(false);
  };

  const onSave = async (sv: Supervisor) => {
    try {
      await createMut.mutateAsync({
        username: sv.email.split('@')[0],
        email: sv.email,
        nome: sv.name,
        senha: 'Temp@2025',
        departamento_id: sv.department_id ? Number(sv.department_id) : undefined,
      });
      toast.success('Supervisor cadastrado com sucesso.');
    } catch {
      toast.error('Erro ao cadastrar supervisor.');
    }
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supervisores"
        description="Gestores e supervisores de equipes"
        actions={
          <button onClick={() => { setEditTarget(null); setDrawerOpen(true); }}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Novo Supervisor
          </button>
        }
      />
      <DataTable data={supervisors} columns={columns}
        searchFields={['name', 'email', 'department_name']}
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
        {drawerOpen && <SupervisorDrawer supervisor={editTarget} departments={departments} onClose={() => setDrawerOpen(false)} onSave={onSave} />}
      </AnimatePresence>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleteLoading} title="Remover supervisor" description={`Remover "${deleteTarget?.name}"?`} />
    </div>
  );
}

function SupervisorDrawer({ supervisor, departments, onClose, onSave }: {
  supervisor: Supervisor | null;
  departments: { id: string; name: string }[];
  onClose: () => void;
  onSave: (s: Supervisor) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit } = useForm({ defaultValues: supervisor ?? {} });

  const onSubmit = async (data: any) => {
    setSaving(true);
    const dept = departments.find(d => d.id === data.department_id);
    await onSave({
      id: supervisor?.id ?? '',
      company_id: '',
      employee_count: supervisor?.employee_count ?? 0,
      created_at: supervisor?.created_at ?? new Date().toISOString(),
      active: Boolean(data.active),
      ...data,
      department_name: dept?.name,
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
          <h2 className="text-sm font-semibold text-foreground">{supervisor ? 'Editar Supervisor' : 'Novo Supervisor'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-4 px-6 py-5">
            <F l="Nome Completo"><input {...register('name')} defaultValue={supervisor?.name} placeholder="Nome do supervisor" className={ic()} /></F>
            <F l="E-mail"><input {...register('email')} defaultValue={supervisor?.email} type="email" placeholder="email@empresa.com" className={ic()} /></F>
            <div className="grid grid-cols-2 gap-3">
              <F l="Telefone"><input {...register('phone')} defaultValue={supervisor?.phone} placeholder="(11) 99999-9999" className={ic()} /></F>
              <F l="CPF"><input {...register('cpf')} defaultValue={supervisor?.cpf} placeholder="000.000.000-00" className={ic()} /></F>
            </div>
            <F l="Departamento">
              <select {...register('department_id')} defaultValue={supervisor?.department_id} className={ic()}>
                <option value="">Selecione...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </F>
            <F l="Função / Cargo"><input {...register('role_name')} defaultValue={supervisor?.role_name} placeholder="Gerente de Operações" className={ic()} /></F>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="sv-active" {...register('active')} defaultChecked={supervisor?.active ?? true} className="h-4 w-4 accent-primary" />
              <label htmlFor="sv-active" className="text-sm text-foreground">Supervisor ativo</label>
            </div>
          </div>
          <div className="border-t border-border px-6 py-4 flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {supervisor ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

const F = ({ l, children }: { l: string; children: React.ReactNode }) => (
  <div><label className="mb-1.5 block text-xs font-medium text-foreground">{l}</label>{children}</div>
);
const ic = () => 'h-9 w-full rounded-lg border border-border bg-input-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30';
