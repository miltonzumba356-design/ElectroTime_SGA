import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { FileText, Loader2, PauseCircle, Pencil, PlayCircle, Plus, Receipt, StopCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { DataTable, type Column } from '../shared/DataTable';
import { Badge } from '../shared/StatusBadge';
import { normalizeList } from '../lib/api-adapters';
import { formatDate } from '../lib/utils';
import {
  useCreateSaasSubscription,
  usePatchSaasSubscription,
  useSaasSubscriptionAction,
  useSaasSubscriptions,
} from '../lib/api-hooks';

interface Subscription {
  id: number;
  empresa: number;
  empresa_nome: string;
  plano: number;
  plano_nome: string;
  status: 'trial' | 'ativa' | 'suspensa' | 'cancelada' | string;
  status_display?: string;
  inicio: string;
  proximo_vencimento?: string | null;
}

const STATUS_VARIANT: Record<string, any> = {
  trial: 'info',
  ativa: 'success',
  suspensa: 'warning',
  cancelada: 'error',
};

export function SaasSubscriptionsPage() {
  const { data, isLoading } = useSaasSubscriptions();
  const createMut = useCreateSaasSubscription();
  const patchMut = usePatchSaasSubscription();
  const suspendMut = useSaasSubscriptionAction('suspend');
  const reactivateMut = useSaasSubscriptionAction('reactivate');
  const cancelMut = useSaasSubscriptionAction('cancel');
  const invoiceMut = useSaasSubscriptionAction('generateInvoice');
  const [drawer, setDrawer] = useState<Subscription | null | 'new'>(null);

  const rows = normalizeList(data, (s: any): Subscription => ({
    id: Number(s.id ?? 0),
    empresa: Number(s.empresa ?? 0),
    empresa_nome: s.empresa_nome ?? '-',
    plano: Number(s.plano ?? 0),
    plano_nome: s.plano_nome ?? '-',
    status: s.status ?? 'trial',
    status_display: s.status_display,
    inicio: s.inicio ?? '',
    proximo_vencimento: s.proximo_vencimento,
  }));

  const columns: Column<Subscription>[] = [
    { key: 'empresa_nome', header: 'Empresa', sortable: true, cell: r => (
      <div>
        <p className="font-medium text-foreground">{r.empresa_nome}</p>
        <p className="text-xs text-muted-foreground">Empresa #{r.empresa}</p>
      </div>
    ) },
    { key: 'plano_nome', header: 'Plano', sortable: true },
    { key: 'status', header: 'Estado', cell: r => <Badge label={r.status_display ?? r.status} variant={STATUS_VARIANT[r.status] ?? 'neutral'} dot /> },
    { key: 'inicio', header: 'Inicio', sortable: true, cell: r => r.inicio ? formatDate(r.inicio) : '-' },
    { key: 'proximo_vencimento', header: 'Prox. vencimento', sortable: true, cell: r => r.proximo_vencimento ? formatDate(r.proximo_vencimento) : '-' },
  ];

  const runAction = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      toast.success(label);
    } catch {
      toast.error('Nao foi possivel concluir a acao.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assinaturas"
        description="Gestao do ciclo de vida das assinaturas das empresas"
        actions={<button onClick={() => setDrawer('new')} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90"><Plus className="h-4 w-4" />Nova assinatura</button>}
      />
      <DataTable
        data={rows}
        columns={columns}
        loading={isLoading}
        searchFields={['empresa_nome', 'plano_nome', 'status']}
        rowActions={row => (
          <div className="flex justify-end gap-1">
            <IconButton title="Editar" icon={Pencil} onClick={() => setDrawer(row)} />
            <IconButton title="Gerar fatura" icon={Receipt} onClick={() => runAction('Fatura gerada.', () => invoiceMut.mutateAsync({ id: row.id }))} />
            {row.status === 'suspensa'
              ? <IconButton title="Reativar" icon={PlayCircle} onClick={() => runAction('Assinatura reativada.', () => reactivateMut.mutateAsync({ id: row.id }))} />
              : <IconButton title="Suspender" icon={PauseCircle} onClick={() => runAction('Assinatura suspensa.', () => suspendMut.mutateAsync({ id: row.id }))} />}
            {row.status !== 'cancelada' && <IconButton title="Cancelar" icon={StopCircle} danger onClick={() => runAction('Assinatura cancelada.', () => cancelMut.mutateAsync({ id: row.id }))} />}
          </div>
        )}
      />
      <AnimatePresence>
        {drawer && (
          <SubscriptionDrawer
            subscription={drawer === 'new' ? null : drawer}
            saving={createMut.isPending || patchMut.isPending}
            onClose={() => setDrawer(null)}
            onSave={async (body, id) => {
              const payload = normalizeSubscriptionPayload(body);
              try {
                if (id) await patchMut.mutateAsync({ id, body: payload });
                else await createMut.mutateAsync(payload);
                toast.success(id ? 'Assinatura atualizada.' : 'Assinatura criada.');
                setDrawer(null);
              } catch {
                toast.error('Nao foi possivel salvar a assinatura.');
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SubscriptionDrawer({ subscription, saving, onClose, onSave }: {
  subscription: Subscription | null;
  saving: boolean;
  onClose: () => void;
  onSave: (body: Record<string, unknown>, id?: number) => Promise<void>;
}) {
  const { register, handleSubmit } = useForm({ defaultValues: subscription ?? {
    empresa: '',
    plano: '',
    status: 'trial',
    inicio: new Date().toISOString().slice(0, 10),
    proximo_vencimento: '',
  } });

  return (
    <Drawer title={subscription ? 'Editar assinatura' : 'Nova assinatura'} onClose={onClose}>
      <form onSubmit={handleSubmit(data => onSave(data, subscription?.id))} className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex-1 space-y-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="ID Empresa"><input {...register('empresa')} type="number" className={inputClass()} required /></Field>
            <Field label="ID Plano"><input {...register('plano')} type="number" className={inputClass()} required /></Field>
          </div>
          <Field label="Estado">
            <select {...register('status')} className={inputClass()}>
              <option value="trial">Trial</option>
              <option value="ativa">Ativa</option>
              <option value="suspensa">Suspensa</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Inicio"><input {...register('inicio')} type="date" className={inputClass()} required /></Field>
            <Field label="Prox. vencimento"><input {...register('proximo_vencimento')} type="date" className={inputClass()} /></Field>
          </div>
        </div>
        <Footer saving={saving} onClose={onClose} label={subscription ? 'Salvar' : 'Criar'} />
      </form>
    </Drawer>
  );
}

function normalizeSubscriptionPayload(data: Record<string, unknown>) {
  return {
    ...data,
    empresa: Number(data.empresa ?? 0),
    plano: Number(data.plano ?? 0),
    proximo_vencimento: data.proximo_vencimento || null,
  };
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
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground"><FileText className="h-4 w-4 text-primary" />{title}</h2>
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
  return 'h-9 w-full rounded-lg border border-border bg-input-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30';
}
