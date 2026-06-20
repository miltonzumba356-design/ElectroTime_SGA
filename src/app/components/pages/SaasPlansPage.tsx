import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import {
  Plus, Pencil, Trash2, X, Loader2,
  CheckCircle2, XCircle, CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { DataTable, type Column } from '../shared/DataTable';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { StatsCard } from '../shared/StatsCard';
import { ActiveBadge, Badge } from '../shared/StatusBadge';
import { normalizeList } from '../lib/api-adapters';
import { formatDate, cn } from '../lib/utils';
import {
  useSaasPlans,
  useCreateSaasPlan,
  usePatchSaasPlan,
  useDeleteSaasPlan,
} from '../lib/api-hooks';

// ─── Types ────────────────────────────────────────────────────────

interface SaasPlan {
  id: number;
  nome: string;
  slug: string;
  descricao: string;
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

interface PlanFormValues {
  nome: string;
  slug: string;
  descricao: string;
  preco_mensal: string;
  max_colaboradores: number;
  ordem: number;
  permite_biometrico: boolean;
  permite_geofencing: boolean;
  permite_relatorios: boolean;
  permite_exportacao: boolean;
  ativo: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────

function money(value: string | number) {
  return `${Number(value ?? 0).toLocaleString('pt-AO')} Kz`;
}

function ic() {
  return 'h-9 w-full rounded-lg border border-border bg-input-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30';
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

// ─── Feature badge ────────────────────────────────────────────────

function FeatureBadge({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors',
        enabled
          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'border-slate-500/20 bg-slate-500/10 text-slate-400 line-through',
      )}
    >
      {enabled
        ? <CheckCircle2 className="h-2.5 w-2.5 flex-shrink-0" />
        : <XCircle className="h-2.5 w-2.5 flex-shrink-0" />}
      {label}
    </span>
  );
}

// ─── Shared sub-components ────────────────────────────────────────

function PrimaryButton({
  children, onClick, icon: Icon,
}: { children: React.ReactNode; onClick: () => void; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <button
      onClick={onClick}
      className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function IconButton({
  title, onClick, icon: Icon, danger = false,
}: { title: string; onClick: () => void; icon: React.ComponentType<{ className?: string }>; danger?: boolean }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors',
        danger ? 'hover:text-red-500' : 'hover:text-foreground',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

function SwitchField({ label, id, register }: { label: string; id: string; register: any }) {
  return (
    <label
      htmlFor={id}
      className="flex h-9 cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 text-sm text-foreground hover:bg-muted/40 transition-colors"
    >
      <input id={id} type="checkbox" {...register} className="h-4 w-4 accent-primary" />
      <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
      {label}
    </label>
  );
}

function DrawerFooter({
  saving, onClose, submitLabel,
}: { saving: boolean; onClose: () => void; submitLabel: string }) {
  return (
    <div className="border-t border-border px-6 py-4 flex justify-end gap-2.5">
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {submitLabel}
      </button>
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────

function PlanDrawer({
  plan,
  saving,
  onClose,
  onSave,
}: {
  plan: SaasPlan | null;
  saving: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>, id?: number) => Promise<void>;
}) {
  const { register, handleSubmit } = useForm<PlanFormValues>({
    defaultValues: plan
      ? {
          nome: plan.nome,
          slug: plan.slug,
          descricao: plan.descricao,
          preco_mensal: plan.preco_mensal,
          max_colaboradores: plan.max_colaboradores,
          ordem: plan.ordem,
          permite_biometrico: plan.permite_biometrico,
          permite_geofencing: plan.permite_geofencing,
          permite_relatorios: plan.permite_relatorios,
          permite_exportacao: plan.permite_exportacao,
          ativo: plan.ativo,
        }
      : {
          nome: '',
          slug: '',
          descricao: '',
          preco_mensal: '0',
          max_colaboradores: 0,
          ordem: 0,
          permite_biometrico: false,
          permite_geofencing: false,
          permite_relatorios: true,
          permite_exportacao: false,
          ativo: true,
        },
  });

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
        className="relative z-10 flex h-full w-full max-w-lg flex-col bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">
              {plan ? 'Editar Plano' : 'Novo Plano'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(data => onSave(data as Record<string, unknown>, plan?.id))}
          className="flex flex-1 flex-col overflow-y-auto"
        >
          <div className="flex-1 space-y-4 px-6 py-5">
            {/* Nome + Slug */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome">
                <input
                  {...register('nome')}
                  placeholder="Pro, Enterprise..."
                  className={ic()}
                  required
                />
              </Field>
              <Field label="Slug">
                <input
                  {...register('slug')}
                  placeholder="pro, enterprise..."
                  className={ic()}
                  required
                />
              </Field>
            </div>

            {/* Descrição */}
            <Field label="Descrição">
              <textarea
                {...register('descricao')}
                placeholder="Descrição do plano..."
                className={cn(ic(), 'min-h-[72px] resize-none py-2')}
              />
            </Field>

            {/* Preço + Max colaboradores + Ordem */}
            <div className="grid grid-cols-3 gap-3">
              <Field label="Preço Mensal (Kz)">
                <input
                  {...register('preco_mensal')}
                  inputMode="decimal"
                  placeholder="0.00"
                  className={ic()}
                />
              </Field>
              <Field label="Max. Colaboradores">
                <input
                  {...register('max_colaboradores')}
                  type="number"
                  min={0}
                  placeholder="0 = ilimitado"
                  className={ic()}
                />
              </Field>
              <Field label="Ordem">
                <input
                  {...register('ordem')}
                  type="number"
                  min={0}
                  className={ic()}
                />
              </Field>
            </div>

            {/* Feature checkboxes */}
            <div>
              <p className="mb-2 text-xs font-medium text-foreground">Funcionalidades</p>
              <div className="grid grid-cols-2 gap-2">
                <SwitchField
                  id="pl-biometrico"
                  label="Biométrico"
                  register={register('permite_biometrico')}
                />
                <SwitchField
                  id="pl-geofencing"
                  label="Geofencing"
                  register={register('permite_geofencing')}
                />
                <SwitchField
                  id="pl-relatorios"
                  label="Relatórios"
                  register={register('permite_relatorios')}
                />
                <SwitchField
                  id="pl-exportacao"
                  label="Exportação"
                  register={register('permite_exportacao')}
                />
              </div>
            </div>

            {/* Ativo */}
            <label
              htmlFor="pl-ativo"
              className="flex h-9 cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 text-sm text-foreground hover:bg-muted/40 transition-colors"
            >
              <input
                id="pl-ativo"
                type="checkbox"
                {...register('ativo')}
                className="h-4 w-4 accent-primary"
              />
              <span>Plano ativo</span>
            </label>
          </div>

          <DrawerFooter saving={saving} onClose={onClose} submitLabel={plan ? 'Salvar' : 'Criar Plano'} />
        </form>
      </motion.div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────

export function SaasPlansPage() {
  const { data, isLoading } = useSaasPlans();
  const createMut = useCreateSaasPlan();
  const patchMut = usePatchSaasPlan();
  const deleteMut = useDeleteSaasPlan();

  const [drawer, setDrawer] = useState<SaasPlan | null | 'new'>(null);
  const [deleteTarget, setDeleteTarget] = useState<SaasPlan | null>(null);

  // Normalise API response
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

  // Stats
  const stats = useMemo(() => {
    const total = plans.length;
    const ativos = plans.filter(p => p.ativo).length;
    const inativos = total - ativos;
    const precos = plans.map(p => Number(p.preco_mensal)).filter(v => v > 0);
    const medio = precos.length ? Math.round(precos.reduce((s, v) => s + v, 0) / precos.length) : 0;
    return { total, ativos, inativos, medio };
  }, [plans]);

  // Columns
  const columns: Column<SaasPlan>[] = [
    {
      key: 'nome',
      header: 'Plano',
      sortable: true,
      cell: row => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <CreditCard className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{row.nome}</p>
            <p className="text-[10px] text-muted-foreground font-mono">{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'preco_mensal',
      header: 'Preço Mensal (Kz)',
      sortable: true,
      cell: row => (
        <span className="text-sm font-medium tabular-nums text-foreground">
          {money(row.preco_mensal)}
        </span>
      ),
    },
    {
      key: 'max_colaboradores',
      header: 'Max Colaboradores',
      sortable: true,
      cell: row => (
        <span className="text-sm text-foreground">
          {row.max_colaboradores === 0 ? (
            <Badge label="Ilimitado" variant="info" />
          ) : (
            row.max_colaboradores
          )}
        </span>
      ),
    },
    {
      key: 'permite_biometrico',
      header: 'Features',
      cell: row => (
        <div className="flex flex-wrap gap-1">
          <FeatureBadge label="Biométrico" enabled={row.permite_biometrico} />
          <FeatureBadge label="Geofencing" enabled={row.permite_geofencing} />
          <FeatureBadge label="Relatórios" enabled={row.permite_relatorios} />
          <FeatureBadge label="Exportação" enabled={row.permite_exportacao} />
        </div>
      ),
    },
    {
      key: 'ativo',
      header: 'Estado',
      cell: row => <ActiveBadge active={row.ativo} />,
    },
    {
      key: 'ordem',
      header: 'Ordem',
      sortable: true,
      cell: row => (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          {row.ordem}
        </span>
      ),
    },
    {
      key: 'criado_em',
      header: 'Criado em',
      sortable: true,
      cell: row => (
        <span className="text-xs text-muted-foreground">
          {row.criado_em ? formatDate(row.criado_em) : '—'}
        </span>
      ),
    },
  ];

  // Save handler
  const save = async (body: Record<string, unknown>, id?: number) => {
    const payload = normalizePlanPayload(body);
    try {
      if (id) {
        await patchMut.mutateAsync({ id, body: payload });
        toast.success('Plano actualizado com sucesso.');
      } else {
        await createMut.mutateAsync(payload);
        toast.success('Plano criado com sucesso.');
      }
      setDrawer(null);
    } catch {
      toast.error('Não foi possível guardar o plano. Tente novamente.');
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      toast.success(`Plano "${deleteTarget.nome}" eliminado.`);
    } catch {
      toast.error('Não foi possível eliminar o plano.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planos SaaS"
        description="Gestão dos planos de assinatura disponíveis para empresas"
        actions={
          <PrimaryButton onClick={() => setDrawer('new')} icon={Plus}>
            Novo Plano
          </PrimaryButton>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatsCard
          title="Total de Planos"
          value={stats.total}
          color="blue"
          delay={0}
        />
        <StatsCard
          title="Planos Ativos"
          value={stats.ativos}
          color="green"
          delay={0.05}
        />
        <StatsCard
          title="Planos Inativos"
          value={stats.inativos}
          color="red"
          delay={0.1}
        />
        <StatsCard
          title="Preço Médio (Kz)"
          value={stats.medio.toLocaleString('pt-AO')}
          color="purple"
          delay={0.15}
        />
      </div>

      {/* Table */}
      <DataTable
        data={plans}
        columns={columns}
        loading={isLoading}
        searchFields={['nome', 'slug']}
        emptyTitle="Nenhum plano encontrado"
        emptyDescription="Crie o primeiro plano de assinatura para começar."
        rowActions={row => (
          <div className="flex items-center justify-end gap-1">
            <IconButton
              title="Editar plano"
              onClick={() => setDrawer(row)}
              icon={Pencil}
            />
            <IconButton
              title="Eliminar plano"
              onClick={() => setDeleteTarget(row)}
              icon={Trash2}
              danger
            />
          </div>
        )}
      />

      {/* Drawer */}
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

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteMut.isPending}
        title="Eliminar plano"
        description={`Tem a certeza que pretende eliminar o plano "${deleteTarget?.nome}"? Esta acção não pode ser desfeita.`}
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
}
