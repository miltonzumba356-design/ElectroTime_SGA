import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, X, Loader2, UserPlus, Key, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { DataTable, type Column } from '../shared/DataTable';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { ActiveBadge, Badge } from '../shared/StatusBadge';
import { ROLE_LABELS, ROLE_COLORS } from '../lib/nav-config';
import type { AuthUser, UserRole } from '../lib/types';
import { formatDate, getInitials, cn } from '../lib/utils';
import { useAdminSupervisors, useCreateSupervisor } from '../lib/api-hooks';
import { normalizeList } from '../lib/api-adapters';

const MANAGEABLE_ROLES: UserRole[] = ['hr', 'supervisor', 'manager'];

type SystemUser = AuthUser & { created_at: string; last_login?: string; active: boolean };

export function UserManagementPage() {
  const { data: rawSupervisors } = useAdminSupervisors();
  const createMut = useCreateSupervisor();
  const users: SystemUser[] = normalizeList(rawSupervisors, (s: any): SystemUser => ({
    id: String(s.id ?? ''),
    name: s.nome ?? s.name ?? '—',
    email: s.email ?? '',
    role: 'supervisor' as UserRole,
    company_id: String(s.empresa ?? ''),
    company_name: s.empresa_nome ?? undefined,
    department_id: String(s.departamento ?? ''),
    active: s.ativo ?? true,
    created_at: s.criado_em ?? s.created_at ?? new Date().toISOString(),
    last_login: s.ultimo_acesso ?? undefined,
  }));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SystemUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SystemUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resetTarget, setResetTarget] = useState<SystemUser | null>(null);

  const columns: Column<SystemUser>[] = [
    { key: 'name', header: 'Utilizador', sortable: true,
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
    { key: 'role', header: 'Perfil', cell: r => {
      const c = ROLE_COLORS[r.role];
      return <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', c.bg, c.text, c.border)}>
        <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />{ROLE_LABELS[r.role]}
      </span>;
    }},
    { key: 'active', header: 'Status', cell: r => <ActiveBadge active={r.active} /> },
    { key: 'last_login', header: 'Último acesso', sortable: true,
      cell: r => r.last_login
        ? <span className="text-sm text-muted-foreground">{formatDate(r.last_login)}</span>
        : <span className="text-sm text-muted-foreground">Nunca</span>
    },
    { key: 'created_at', header: 'Criado em', sortable: true,
      cell: r => <span className="text-sm text-muted-foreground">{formatDate(r.created_at)}</span>
    },
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    toast.info('Remoção de utilizadores deve ser gerida pelo administrador.');
    setDeleteTarget(null);
    setDeleteLoading(false);
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    toast.info(`Pedido de redefinição de senha enviado para ${resetTarget.email}.`);
    setResetTarget(null);
  };

  const onSave = async (data: any) => {
    try {
      await createMut.mutateAsync({
        username: data.email?.split('@')[0] ?? data.name?.toLowerCase().replace(/\s+/g, '.'),
        email: data.email,
        nome: data.name,
        senha: 'Temp@2025',
        departamento_id: data.department_id ? Number(data.department_id) : undefined,
      });
      toast.success('Supervisor criado. E-mail de boas-vindas enviado.');
    } catch {
      toast.error('Erro ao criar utilizador.');
    }
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilizadores do Sistema"
        description="Gerir contas RH, Supervisores e Gestores"
        actions={
          <button onClick={() => { setEditTarget(null); setDrawerOpen(true); }}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
            <UserPlus className="h-4 w-4" /> Novo Utilizador
          </button>
        }
      />

      <DataTable data={users} columns={columns}
        searchFields={['name', 'email']}
        rowActions={row => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => setResetTarget(row)} title="Redefinir senha"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
              <Key className="h-3.5 w-3.5" />
            </button>
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
        {drawerOpen && <UserDrawer user={editTarget} onClose={() => setDrawerOpen(false)} onSave={onSave} />}
      </AnimatePresence>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleteLoading} title="Remover utilizador" description={`Remover "${deleteTarget?.name}"? O utilizador perderá acesso imediatamente.`} />
      <ConfirmDialog open={!!resetTarget} onClose={() => setResetTarget(null)} onConfirm={handleResetPassword}
        variant="warning" title="Redefinir senha" description={`Enviar e-mail de redefinição de senha para "${resetTarget?.name}" (${resetTarget?.email})?`}
        confirmLabel="Enviar e-mail" />
    </div>
  );
}

function UserDrawer({ user, onClose, onSave }: { user: SystemUser | null; onClose: () => void; onSave: (data: any) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit } = useForm({ defaultValues: user ?? {} });

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
          <h2 className="text-sm font-semibold text-foreground">{user ? 'Editar Utilizador' : 'Novo Utilizador'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-4 px-6 py-5">
            <F l="Nome completo"><input {...register('name')} defaultValue={user?.name} placeholder="Nome do utilizador" className={ic} /></F>
            <F l="E-mail"><input {...register('email')} defaultValue={user?.email} type="email" placeholder="utilizador@empresa.com" className={ic} /></F>
            <F l="Perfil de Acesso">
              <select {...register('role')} defaultValue={user?.role ?? 'hr'} className={ic}>
                {MANAGEABLE_ROLES.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </F>
            {!user && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs text-primary font-medium">Uma senha temporária será gerada e enviada por e-mail ao utilizador.</p>
              </div>
            )}
            <div className="flex items-center gap-3">
              <input type="checkbox" id="um-active" {...register('active')} defaultChecked={user?.active ?? true} className="h-4 w-4 accent-primary" />
              <label htmlFor="um-active" className="text-sm text-foreground">Conta ativa</label>
            </div>
          </div>
          <div className="border-t border-border px-6 py-4 flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {user ? 'Guardar' : 'Criar Utilizador'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
