import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, X, Loader2, UserPlus, Key } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { DataTable, type Column } from '../shared/DataTable';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { ActiveBadge } from '../shared/StatusBadge';
import { ROLE_LABELS, ROLE_COLORS } from '../lib/nav-config';
import type { AuthUser, UserRole } from '../lib/types';
import { formatDate, getInitials, cn } from '../lib/utils';
import { useAdminDepartments, useAdminSupervisors, useCreateRh, useCreateSupervisor } from '../lib/api-hooks';
import { normalizeList } from '../lib/api-adapters';

const CREATABLE_ROLES: UserRole[] = ['rh', 'supervisor', 'chefe_departamento'];

type SystemUser = AuthUser & { created_at: string; last_login?: string; active: boolean };
type UserFormData = {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  department_id?: string;
  active?: boolean;
};

export function UserManagementPage() {
  const { data: rawSupervisors } = useAdminSupervisors();
  const { data: rawDepartments } = useAdminDepartments();
  const createSupervisor = useCreateSupervisor();
  const createRh = useCreateRh();

  const users: SystemUser[] = normalizeList(rawSupervisors, (s: any): SystemUser => ({
    id: String(s.id ?? ''),
    name: s.nome ?? s.name ?? '-',
    email: s.email ?? '',
    role: 'supervisor',
    company_id: String(s.empresa ?? ''),
    company_name: s.empresa_nome ?? undefined,
    department_id: String(s.departamento_id ?? s.departamento ?? ''),
    active: s.ativo ?? true,
    created_at: s.criado_em ?? s.created_at ?? new Date().toISOString(),
    last_login: s.ultimo_acesso ?? undefined,
  }));

  const departments = normalizeList(rawDepartments, (d: any) => ({
    id: String(d.id),
    name: d.nome ?? d.name ?? '',
  }));

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SystemUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SystemUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resetTarget, setResetTarget] = useState<SystemUser | null>(null);

  const columns: Column<SystemUser>[] = [
    {
      key: 'name',
      header: 'Utilizador',
      sortable: true,
      cell: r => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {getInitials(r.name)}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{r.name}</p>
            <p className="text-xs text-muted-foreground">{r.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Perfil',
      cell: r => {
        const c = ROLE_COLORS[r.role];
        return (
          <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', c.bg, c.text, c.border)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />
            {ROLE_LABELS[r.role]}
          </span>
        );
      },
    },
    { key: 'active', header: 'Status', cell: r => <ActiveBadge active={r.active} /> },
    {
      key: 'last_login',
      header: 'Último acesso',
      sortable: true,
      cell: r => r.last_login
        ? <span className="text-sm text-muted-foreground">{formatDate(r.last_login)}</span>
        : <span className="text-sm text-muted-foreground">Nunca</span>,
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
    toast.info('Remoção de utilizadores não tem endpoint documentado no contrato atual.');
    setDeleteTarget(null);
    setDeleteLoading(false);
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    toast.info('Redefinição de senha não tem endpoint documentado no contrato atual.');
    setResetTarget(null);
  };

  const onSave = async (data: UserFormData) => {
    if (editTarget) {
      toast.info('Edição de utilizadores não tem endpoint documentado no contrato atual.');
      setDrawerOpen(false);
      return;
    }

    if (data.role === 'chefe_departamento') {
      toast.error('Chefe de Departamento existe como role, mas não há endpoint de criação no YAML.');
      return;
    }

    const bodyBase = {
      username: data.email?.split('@')[0] ?? data.name?.toLowerCase().replace(/\s+/g, '.'),
      email: data.email,
      nome: data.name,
      senha: data.password ?? '',
    };

    try {
      if (data.role === 'rh') {
        await createRh.mutateAsync(bodyBase);
        toast.success('Utilizador RH criado com sucesso.');
      } else if (data.role === 'supervisor') {
        await createSupervisor.mutateAsync({
          ...bodyBase,
          departamento_id: data.department_id ? Number(data.department_id) : undefined,
        });
        toast.success('Supervisor criado com sucesso.');
      }
      setDrawerOpen(false);
    } catch {
      toast.error('Erro ao criar utilizador.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilizadores do Sistema"
        description="Gerir contas suportadas pelos endpoints de administração"
        actions={
          <button
            onClick={() => { setEditTarget(null); setDrawerOpen(true); }}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="h-4 w-4" /> Novo Utilizador
          </button>
        }
      />

      <DataTable
        data={users}
        columns={columns}
        searchFields={['name', 'email']}
        rowActions={row => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => setResetTarget(row)}
              title="Redefinir senha"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Key className="h-3.5 w-3.5" />
            </button>
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
          <UserDrawer
            user={editTarget}
            departments={departments}
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
        title="Remover utilizador"
        description={`Remover "${deleteTarget?.name}"?`}
      />
      <ConfirmDialog
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        onConfirm={handleResetPassword}
        variant="warning"
        title="Redefinir senha"
        description={`Redefinir senha de "${resetTarget?.name}" (${resetTarget?.email})?`}
        confirmLabel="Continuar"
      />
    </div>
  );
}

function UserDrawer({
  user,
  departments,
  onClose,
  onSave,
}: {
  user: SystemUser | null;
  departments: { id: string; name: string }[];
  onClose: () => void;
  onSave: (data: UserFormData) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<UserFormData>({
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      role: user?.role ?? 'rh',
      department_id: user?.department_id ?? '',
      active: user?.active ?? true,
    },
  });
  const selectedRole = watch('role');

  const onSubmit = async (data: UserFormData) => {
    setSaving(true);
    await onSave(data);
    setSaving(false);
  };

  const ic = 'h-9 w-full rounded-lg border border-border bg-input-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-70 disabled:cursor-not-allowed';
  const F = ({ l, children }: { l: string; children: React.ReactNode }) => (
    <div><label className="mb-1.5 block text-xs font-medium text-foreground">{l}</label>{children}</div>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative z-10 flex h-full w-full max-w-md flex-col bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">{user ? 'Detalhe do Utilizador' : 'Novo Utilizador'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-4 px-6 py-5">
            <F l="Nome completo">
              <input {...register('name', { required: 'Obrigatório' })} disabled={!!user} placeholder="Nome do utilizador" className={ic} />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
            </F>
            <F l="E-mail">
              <input {...register('email', { required: 'Obrigatório' })} disabled={!!user} type="email" placeholder="utilizador@empresa.com" className={ic} />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </F>
            <F l="Perfil de Acesso">
              <select {...register('role', { required: true })} disabled={!!user} className={ic}>
                {CREATABLE_ROLES.map(r => (
                  <option key={r} value={r} disabled={r === 'chefe_departamento'}>
                    {ROLE_LABELS[r]}{r === 'chefe_departamento' ? ' (sem endpoint)' : ''}
                  </option>
                ))}
              </select>
            </F>
            {selectedRole === 'supervisor' && (
              <F l="Departamento">
                <select {...register('department_id')} disabled={!!user} className={ic}>
                  <option value="">Sem departamento</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </F>
            )}
            {!user && (
              <F l="Senha inicial">
                <input
                  {...register('password', { required: 'Obrigatório' })}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Defina a senha inicial"
                  className={ic}
                />
                {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
              </F>
            )}
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                O YAML documenta criação apenas para RH e Supervisor. Edição, remoção, redefinição de senha e criação de Chefe de Departamento ainda não têm endpoint dedicado.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="um-active" {...register('active')} disabled={!!user} className="h-4 w-4 accent-primary" />
              <label htmlFor="um-active" className="text-sm text-foreground">Conta ativa</label>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 border-t border-border px-6 py-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">Cancelar</button>
            {!user && (
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Criar Utilizador
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
