import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { KeyRound, Loader2, Pencil, Search, Shield, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { DataTable, type Column } from '../shared/DataTable';
import { ActiveBadge, Badge } from '../shared/StatusBadge';
import { normalizeList } from '../lib/api-adapters';
import { usePatchSaasUser, useResetSaasUserPassword, useSaasUsers } from '../lib/api-hooks';

interface SaasUser {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  tipo_role?: string | null;
  tipo_role_display?: string | null;
  empresa_id?: number | null;
  empresa_nome?: string | null;
  cargo?: string | null;
}

export function SaasUsersPage() {
  const [role, setRole] = useState('');
  const [empresa, setEmpresa] = useState('');
  const queryParams = { page: 1, role: role || undefined, empresa: empresa || undefined };
  const { data, isLoading } = useSaasUsers(queryParams);
  const patchMut = usePatchSaasUser();
  const resetMut = useResetSaasUserPassword();
  const [editTarget, setEditTarget] = useState<SaasUser | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<SaasUser | null>(null);

  const users = normalizeList(data, (u: any): SaasUser => ({
    id: Number(u.id ?? 0),
    username: u.username ?? '',
    email: u.email ?? '',
    first_name: u.first_name ?? '',
    last_name: u.last_name ?? '',
    is_active: u.is_active ?? true,
    tipo_role: u.tipo_role,
    tipo_role_display: u.tipo_role_display,
    empresa_id: u.empresa_id,
    empresa_nome: u.empresa_nome,
    cargo: u.cargo,
  }));

  const columns: Column<SaasUser>[] = [
    { key: 'username', header: 'Utilizador', sortable: true, cell: row => (
      <div>
        <p className="font-medium text-foreground">{row.first_name || row.last_name ? `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() : row.username}</p>
        <p className="text-xs text-muted-foreground">{row.username}</p>
      </div>
    ) },
    { key: 'email', header: 'E-mail', sortable: true, cell: row => row.email || '-' },
    { key: 'tipo_role', header: 'Role', cell: row => <Badge label={row.tipo_role_display ?? row.tipo_role ?? '-'} variant="info" /> },
    { key: 'empresa_nome', header: 'Empresa', sortable: true, cell: row => row.empresa_nome || '-' },
    { key: 'cargo', header: 'Cargo', cell: row => row.cargo || '-' },
    { key: 'is_active', header: 'Estado', cell: row => <ActiveBadge active={row.is_active} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Utilizadores SaaS" description="Consulta e edicao global de utilizadores da plataforma" />
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-end">
        <Field label="Role">
          <select value={role} onChange={e => setRole(e.target.value)} className={inputClass()}>
            <option value="">Todos</option>
            <option value="admin">Admin</option>
            <option value="rh">RH</option>
            <option value="supervisor">Supervisor</option>
            <option value="chefe_departamento">Chefe departamento</option>
            <option value="colaborador">Colaborador</option>
            <option value="dono_saas">Dono SaaS</option>
          </select>
        </Field>
        <Field label="Empresa">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="ID ou UUID" className={`${inputClass()} pl-9`} />
          </div>
        </Field>
      </div>
      <DataTable
        data={users}
        columns={columns}
        loading={isLoading}
        searchFields={['username', 'email', 'empresa_nome', 'cargo']}
        rowActions={row => (
          <div className="flex justify-end gap-1">
            <button title="Editar" onClick={() => setEditTarget(row)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
            <button title="Redefinir senha" onClick={() => setPasswordTarget(row)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><KeyRound className="h-3.5 w-3.5" /></button>
          </div>
        )}
      />
      <AnimatePresence>
        {editTarget && (
          <UserDrawer
            user={editTarget}
            saving={patchMut.isPending}
            onClose={() => setEditTarget(null)}
            onSave={async (body) => {
              try {
                await patchMut.mutateAsync({ id: editTarget.id, body: { ...body, is_active: Boolean(body.is_active) } });
                toast.success('Utilizador atualizado.');
                setEditTarget(null);
              } catch {
                toast.error('Nao foi possivel atualizar o utilizador.');
              }
            }}
          />
        )}
        {passwordTarget && (
          <PasswordDialog
            user={passwordTarget}
            saving={resetMut.isPending}
            onClose={() => setPasswordTarget(null)}
            onSave={async (nova_senha) => {
              try {
                await resetMut.mutateAsync({ id: passwordTarget.id, nova_senha });
                toast.success('Senha redefinida.');
                setPasswordTarget(null);
              } catch {
                toast.error('Nao foi possivel redefinir a senha.');
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function UserDrawer({ user, saving, onClose, onSave }: {
  user: SaasUser;
  saving: boolean;
  onClose: () => void;
  onSave: (body: Record<string, unknown>) => Promise<void>;
}) {
  const { register, handleSubmit } = useForm({ defaultValues: user });
  return (
    <Drawer title="Editar utilizador" onClose={onClose}>
      <form onSubmit={handleSubmit(onSave)} className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex-1 space-y-4 px-6 py-5">
          <Field label="Username"><input value={user.username} disabled className={`${inputClass()} opacity-70`} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Primeiro nome"><input {...register('first_name')} className={inputClass()} /></Field>
            <Field label="Ultimo nome"><input {...register('last_name')} className={inputClass()} /></Field>
          </div>
          <Field label="E-mail"><input {...register('email')} type="email" className={inputClass()} /></Field>
          <label className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm text-foreground">
            <input type="checkbox" {...register('is_active')} className="h-4 w-4 accent-primary" />
            Conta ativa
          </label>
        </div>
        <Footer saving={saving} onClose={onClose} label="Salvar" />
      </form>
    </Drawer>
  );
}

function PasswordDialog({ user, saving, onClose, onSave }: {
  user: SaasUser;
  saving: boolean;
  onClose: () => void;
  onSave: (novaSenha: string) => Promise<void>;
}) {
  const { register, handleSubmit } = useForm({ defaultValues: { nova_senha: '' } });
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.form initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} onSubmit={handleSubmit(data => onSave(data.nova_senha))} className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><KeyRound className="h-5 w-5 text-primary" /></div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Redefinir senha</h3>
            <p className="text-xs text-muted-foreground">{user.username}</p>
          </div>
        </div>
        <Field label="Nova senha">
          <input {...register('nova_senha')} type="password" minLength={6} required className={inputClass()} />
        </Field>
        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">Cancelar</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Redefinir
          </button>
        </div>
      </motion.form>
    </div>
  );
}

function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }} className="relative z-10 flex h-full w-full max-w-lg flex-col bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Shield className="h-4 w-4 text-primary" />{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="min-w-0 flex-1"><label className="mb-1.5 block text-xs font-medium text-foreground">{label}</label>{children}</div>;
}

function Footer({ saving, onClose, label }: { saving: boolean; onClose: () => void; label: string }) {
  return (
    <div className="flex justify-end gap-2.5 border-t border-border px-6 py-4">
      <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">Cancelar</button>
      <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {label}
      </button>
    </div>
  );
}

function inputClass() {
  return 'h-9 w-full rounded-lg border border-border bg-input-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30';
}
