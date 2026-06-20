import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { CheckCircle2, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { DataTable, type Column } from '../shared/DataTable';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { ActiveBadge } from '../shared/StatusBadge';
import { normalizeList } from '../lib/api-adapters';
import { formatDate } from '../lib/utils';
import {
  useCreateSaasPlan,
  useDeleteSaasPlan,
  usePatchSaasPlan,
  useSaasPlans,
} from '../lib/api-hooks';

interface SaasPlan {
  id: number;
  nome: string;
  slug: string;
  descricao?: string;
  preco_mensal: string;
  max_colaboradores: number;
  permite_biometrico: boolean;
  permite_geofencing: boolean;
  permite_relatorios: boolean;
  permite_exportacao: boolean;
  ativo: boolean;
  ordem: number;
  criado_em?: string;
}

export function SaasPlansPage() {
  const { data, isLoading } = useSaasPlans();
  const createMut = useCreateSaasPlan();
  const patchMut = usePatchSaasPlan();
  const deleteMut = useDeleteSaasPlan();
  const [drawer, setDrawer] = useState<SaasPlan | null | 'new'>(null);
  const [deleteTarget, setDeleteTarget] = useState<SaasPlan | null>(null);

  const plans = normalizeList(data, (p: any): SaasPlan => ({
    id: Number(p.id ?? 0),
    nome: p.nome ?? '',
    slug: p.slug ?? '',
    descricao: p.descricao ?? '',
    preco_mensal: String(p.preco_mensal ?? '0'),
    max_colaboradores: Number(p.max_colaboradores ?? 0),
    permite_biometrico: Boolean(p.permite_biometrico),
    permite_geofencing: Boolean(p.permite_geofencing),
    permite_relatorios: Boolean(p.permite_relatorios),
    permite_exportacao: Boolean(p.permite_exportacao),
    ativo: p.ativo ?? true,
    ordem: Number(p.ordem ?? 0),
    criado_em: p.criado_em,
  }));

  const columns: Column<SaasPlan>[] = [
    { key: 'nome', header: 'Plano', sortable: true, cell: row => (
      <div>
        <p className="font-medium text-foreground">{row.nome}</p>
        <p className="text-xs text-muted-foreground">{row.slug}</p>
      </div>
    ) },
    { key: 'preco_mensal', header: 'Preco mensal', sortable: true, cell: row => <span>{money(row.preco_mensal)}</span> },
    { key: 'max_colaboradores', header: 'Colaboradores', sortable: true, cell: row => row.max_colaboradores === 0 ? 'Ilimitado' : row.max_colaboradores },
    { key: 'ativo', header: 'Estado', cell: row => <ActiveBadge active={row.ativo} /> },
    { key: 'ordem', header: 'Ordem', sortable: true },
    { key: 'criado_em', header: 'Criado em', sortable: true, cell: row => row.criado_em ? formatDate(row.criado_em) : '-' },
  ];

  const save = async (body: Record<string, unknown>, id?: number) => {
    const payload = normalizePlanPayload(body);
    try {
      if (id) await patchMut.mutateAsync({ id, body: payload });
      else await createMut.mutateAsync(payload);
      toast.success(id ? 'Plano atualizado.' : 'Plano criado.');
      setDrawer(null);
    } catch {
      toast.error('Nao foi possivel salvar o plano.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planos SaaS"
        description="Gestao dos planos de assinatura disponiveis para empresas"
        actions={<PrimaryButton onClick={() => setDrawer('new')} icon={Plus}>Novo plano</PrimaryButton>}
      />
      <DataTable
        data={plans}
        columns={columns}
        loading={isLoading}
        searchFields={['nome', 'slug']}
        rowActions={row => (
          <div className="flex justify-end gap-1">
            <IconButton title="Editar" onClick={() => setDrawer(row)} icon={Pencil} />
            <IconButton title="Eliminar" onClick={() => setDeleteTarget(row)} icon={Trash2} danger />
          </div>
        )}
      />
      <AnimatePresence>
        {drawer && (
          <PlanDrawer
            plan={drawer === 'new' ? null : drawer}
            saving={createMut.isPending || patchMut.isPending}
            onClose={() => setDrawer(null)}
            onSave={save}
          />
        )}
      </AnimatePresence>
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteMut.mutateAsync(deleteTarget.id);
            toast.success('Plano eliminado.');
          } catch {
            toast.error('Nao foi possivel eliminar o plano.');
          } finally {
            setDeleteTarget(null);
          }
        }}
        loading={deleteMut.isPending}
        title="Eliminar plano"
        description={`Eliminar "${deleteTarget?.nome}"?`}
      />
    </div>
  );
}

function PlanDrawer({ plan, saving, onClose, onSave }: {
  plan: SaasPlan | null;
  saving: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>, id?: number) => Promise<void>;
}) {
  const { register, handleSubmit } = useForm({ defaultValues: plan ?? {
    nome: '',
    slug: '',
    descricao: '',
    preco_mensal: '0',
    max_colaboradores: 0,
    permite_biometrico: false,
    permite_geofencing: true,
    permite_relatorios: true,
    permite_exportacao: false,
    ativo: true,
    ordem: 0,
  } });

  return (
    <Drawer title={plan ? 'Editar plano' : 'Novo plano'} onClose={onClose}>
      <form onSubmit={handleSubmit(data => onSave(data, plan?.id))} className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex-1 space-y-4 px-6 py-5">
          <Field label="Nome"><input {...register('nome')} className={inputClass()} required /></Field>
          <Field label="Slug"><input {...register('slug')} className={inputClass()} required placeholder="free, pro, enterprise" /></Field>
          <Field label="Descricao"><textarea {...register('descricao')} className={`${inputClass()} min-h-20 py-2`} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Preco mensal (Kz)"><input {...register('preco_mensal')} className={inputClass()} inputMode="decimal" /></Field>
            <Field label="Max. colaboradores"><input {...register('max_colaboradores')} type="number" className={inputClass()} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ordem"><input {...register('ordem')} type="number" className={inputClass()} /></Field>
            <SwitchField label="Ativo" register={register('ativo')} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <SwitchField label="Biometrico" register={register('permite_biometrico')} />
            <SwitchField label="Geofencing" register={register('permite_geofencing')} />
            <SwitchField label="Relatorios" register={register('permite_relatorios')} />
            <SwitchField label="Exportacao" register={register('permite_exportacao')} />
          </div>
        </div>
        <DrawerFooter saving={saving} onClose={onClose} submitLabel={plan ? 'Salvar' : 'Criar'} />
      </form>
    </Drawer>
  );
}

function normalizePlanPayload(data: Record<string, unknown>) {
  return {
    ...data,
    max_colaboradores: Number(data.max_colaboradores ?? 0),
    ordem: Number(data.ordem ?? 0),
    ativo: Boolean(data.ativo),
    permite_biometrico: Boolean(data.permite_biometrico),
    permite_geofencing: Boolean(data.permite_geofencing),
    permite_relatorios: Boolean(data.permite_relatorios),
    permite_exportacao: Boolean(data.permite_exportacao),
  };
}

function money(value: string | number) {
  return `${Number(value ?? 0).toLocaleString('pt-AO')} Kz`;
}

function PrimaryButton({ children, onClick, icon: Icon }: { children: React.ReactNode; onClick: () => void; icon: any }) {
  return <button onClick={onClick} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90"><Icon className="h-4 w-4" />{children}</button>;
}

function IconButton({ title, onClick, icon: Icon, danger = false }: { title: string; onClick: () => void; icon: any; danger?: boolean }) {
  return <button title={title} onClick={onClick} className={`flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted ${danger ? 'hover:text-red-500' : 'hover:text-foreground'}`}><Icon className="h-3.5 w-3.5" /></button>;
}

function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }} className="relative z-10 flex h-full w-full max-w-lg flex-col bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-xs font-medium text-foreground">{label}</label>{children}</div>;
}

function SwitchField({ label, register }: { label: string; register: any }) {
  return (
    <label className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm text-foreground">
      <input type="checkbox" {...register} className="h-4 w-4 accent-primary" />
      <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
      {label}
    </label>
  );
}

function DrawerFooter({ saving, onClose, submitLabel }: { saving: boolean; onClose: () => void; submitLabel: string }) {
  return (
    <div className="flex justify-end gap-2.5 border-t border-border px-6 py-4">
      <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">Cancelar</button>
      <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {submitLabel}
      </button>
    </div>
  );
}

function inputClass() {
  return 'h-9 w-full rounded-lg border border-border bg-input-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30';
}
