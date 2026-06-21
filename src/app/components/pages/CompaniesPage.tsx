import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, X, Loader2, Factory } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { DataTable, type Column } from '../shared/DataTable';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { ActiveBadge, Badge } from '../shared/StatusBadge';
import type { Company, PlanType } from '../lib/types';
import { useCompanies } from '../lib/api-hooks';
import { normalizeList } from '../lib/api-adapters';
import { formatNIF, formatDate } from '../lib/utils';

const PLAN_LABELS: Record<PlanType, string> = {
  basic: 'Basic',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

const PLAN_VARIANTS: Record<PlanType, any> = {
  basic: 'neutral',
  professional: 'info',
  enterprise: 'default',
};

const ANGOLA_PROVINCES = [
  'Bengo',
  'Benguela',
  'Bié',
  'Cabinda',
  'Cuando Cubango',
  'Cuanza Norte',
  'Cuanza Sul',
  'Cunene',
  'Huambo',
  'Huíla',
  'Luanda',
  'Lunda Norte',
  'Lunda Sul',
  'Malanje',
  'Moxico',
  'Namibe',
  'Uíge',
  'Zaire',
];

export function CompaniesPage() {
  const { data: rawCompanies } = useCompanies();
  const companies: Company[] = normalizeList(rawCompanies, (c: any): Company => ({
    id: String(c.id ?? ''),
    name: c.nome ?? c.name ?? '',
    trade_name: c.nome_fantasia ?? c.trade_name ?? undefined,
    cnpj: c.nif ?? c.cnpj ?? '',
    email: c.email ?? '',
    phone: c.telefone ?? c.phone ?? '',
    address: c.endereco ?? c.address ?? '',
    city: c.cidade ?? c.city ?? '',
    state: c.estado ?? c.state ?? '',
    plan: c.plano ?? c.plan ?? 'basic',
    employee_count: c.total_colaboradores ?? c.employee_count ?? 0,
    active: c.ativo ?? c.active ?? true,
    created_at: c.criado_em ?? c.created_at ?? new Date().toISOString(),
  }));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Company | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const columns: Column<Company>[] = [
    { key: 'name', header: 'Empresa', sortable: true,
      cell: r => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Factory className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{r.name}</p>
            <p className="text-xs text-muted-foreground">{formatNIF(r.cnpj)}</p>
          </div>
        </div>
      )
    },
    { key: 'city', header: 'Localização', sortable: true,
      cell: r => <span className="text-sm">{[r.city, r.state].filter(Boolean).join(', ')}</span>
    },
    { key: 'email', header: 'E-mail', cell: r => <span className="text-sm text-muted-foreground">{r.email}</span> },
    { key: 'plan', header: 'Plano', cell: r => <Badge label={PLAN_LABELS[r.plan]} variant={PLAN_VARIANTS[r.plan]} /> },
    { key: 'employee_count', header: 'Funcionários', sortable: true, cell: r => <span className="text-sm font-medium">{r.employee_count}</span> },
    { key: 'active', header: 'Status', cell: r => <ActiveBadge active={r.active} /> },
    { key: 'created_at', header: 'Criado em', sortable: true, cell: r => <span className="text-sm text-muted-foreground">{formatDate(r.created_at)}</span> },
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    toast.info('Eliminação de empresas deve ser gerida pelo SaaS Owner.');
    setDeleteTarget(null);
    setDeleteLoading(false);
  };

  const onSave = async (data: any) => {
    toast.info('Cadastro de empresas é feito via solicitação de registro.');
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empresas"
        description="Gestão de empresas cadastradas na plataforma"
        actions={
          <button onClick={() => { setEditTarget(null); setDrawerOpen(true); }}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Nova Empresa
          </button>
        }
      />
      <DataTable data={companies} columns={columns}
        searchFields={['name', 'cnpj', 'city', 'email']}
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
        {drawerOpen && <CompanyDrawer company={editTarget} onClose={() => setDrawerOpen(false)} onSave={onSave} />}
      </AnimatePresence>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleteLoading} title="Remover empresa" description={`Remover "${deleteTarget?.name}"?`} />
    </div>
  );
}

function CompanyDrawer({ company, onClose, onSave }: { company: Company | null; onClose: () => void; onSave: (data: any) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit } = useForm({ defaultValues: company ?? {} });

  const onSubmit = async (data: any) => {
    setSaving(true);
    await onSave(data);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative z-10 flex h-full w-full max-w-lg flex-col bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">{company ? 'Editar Empresa' : 'Nova Empresa'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-4 px-6 py-5">
            <F l="Razão Social"><input {...register('name')} defaultValue={company?.name} placeholder="Empresa Lda." className={ic()} /></F>
            <F l="Nome Fantasia"><input {...register('trade_name')} defaultValue={company?.trade_name} placeholder="Empresa" className={ic()} /></F>
            <F l="NIF"><input {...register('cnpj')} defaultValue={company?.cnpj} placeholder="Número de Identificação Fiscal" className={ic()} /></F>
            <div className="grid grid-cols-2 gap-3">
              <F l="E-mail"><input {...register('email')} defaultValue={company?.email} type="email" className={ic()} /></F>
              <F l="Telefone"><input {...register('phone')} defaultValue={company?.phone} className={ic()} /></F>
            </div>
            <F l="Endereço"><input {...register('address')} defaultValue={company?.address} placeholder="Rua, bairro" className={ic()} /></F>
            <div className="grid grid-cols-2 gap-3">
              <F l="Município"><input {...register('city')} defaultValue={company?.city} placeholder="Luanda" className={ic()} /></F>
              <F l="Província">
                <select {...register('state')} defaultValue={company?.state ?? 'Luanda'} className={ic()}>
                  {ANGOLA_PROVINCES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </F>
            </div>
            <F l="Plano">
              <select {...register('plan')} defaultValue={company?.plan ?? 'professional'} className={ic()}>
                <option value="basic">Basic</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </F>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="co-active" {...register('active')} defaultChecked={company?.active ?? true} className="h-4 w-4 accent-primary" />
              <label htmlFor="co-active" className="text-sm text-foreground">Empresa ativa</label>
            </div>
          </div>
          <div className="border-t border-border px-6 py-4 flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {company ? 'Salvar' : 'Cadastrar'}
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
