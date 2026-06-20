import { CheckCircle2, ReceiptText } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { StatsCard } from '../shared/StatsCard';
import { DataTable, type Column } from '../shared/DataTable';
import { Badge } from '../shared/StatusBadge';
import { normalizeList } from '../lib/api-adapters';
import { formatDate, formatDateTime } from '../lib/utils';
import { useMarkSaasInvoicePaid, useSaasInvoices } from '../lib/api-hooks';

interface Invoice {
  id: number;
  assinatura: number;
  empresa: number;
  empresa_nome: string;
  valor: string;
  status: 'pendente' | 'paga' | 'vencida' | 'cancelada' | string;
  status_display?: string;
  referencia?: string;
  vencimento: string;
  pago_em?: string | null;
  criado_em?: string;
}

const STATUS_VARIANT: Record<string, any> = {
  pendente: 'warning',
  paga: 'success',
  vencida: 'error',
  cancelada: 'neutral',
};

export function SaasInvoicesPage() {
  const { data, isLoading } = useSaasInvoices();
  const markPaid = useMarkSaasInvoicePaid();
  const invoices = normalizeList(data, (f: any): Invoice => ({
    id: Number(f.id ?? 0),
    assinatura: Number(f.assinatura ?? 0),
    empresa: Number(f.empresa ?? 0),
    empresa_nome: f.empresa_nome ?? '-',
    valor: String(f.valor ?? '0'),
    status: f.status ?? 'pendente',
    status_display: f.status_display,
    referencia: f.referencia,
    vencimento: f.vencimento ?? '',
    pago_em: f.pago_em,
    criado_em: f.criado_em,
  }));

  const pendingValue = invoices
    .filter(i => i.status === 'pendente' || i.status === 'vencida')
    .reduce((sum, i) => sum + Number(i.valor || 0), 0);

  const columns: Column<Invoice>[] = [
    { key: 'empresa_nome', header: 'Empresa', sortable: true, cell: row => (
      <div>
        <p className="font-medium text-foreground">{row.empresa_nome}</p>
        <p className="text-xs text-muted-foreground">Assinatura #{row.assinatura}</p>
      </div>
    ) },
    { key: 'valor', header: 'Valor', sortable: true, cell: row => money(row.valor) },
    { key: 'status', header: 'Estado', cell: row => <Badge label={row.status_display ?? row.status} variant={STATUS_VARIANT[row.status] ?? 'neutral'} dot /> },
    { key: 'referencia', header: 'Referencia', cell: row => row.referencia || '-' },
    { key: 'vencimento', header: 'Vencimento', sortable: true, cell: row => row.vencimento ? formatDate(row.vencimento) : '-' },
    { key: 'pago_em', header: 'Pago em', sortable: true, cell: row => row.pago_em ? formatDateTime(row.pago_em) : '-' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Faturas" description="Consulta de faturas SaaS e marcacao de pagamentos" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatsCard title="Total de faturas" value={invoices.length} color="blue" icon={<ReceiptText className="h-5 w-5" />} />
        <StatsCard title="Pendentes" value={invoices.filter(i => i.status === 'pendente').length} color="yellow" />
        <StatsCard title="Valor pendente" value={money(pendingValue)} color="red" />
      </div>
      <DataTable
        data={invoices}
        columns={columns}
        loading={isLoading}
        searchFields={['empresa_nome', 'referencia', 'status']}
        rowActions={row => row.status !== 'paga' ? (
          <button
            title="Marcar como paga"
            onClick={async () => {
              try {
                await markPaid.mutateAsync({ id: row.id });
                toast.success('Fatura marcada como paga.');
              } catch {
                toast.error('Nao foi possivel marcar a fatura como paga.');
              }
            }}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      />
    </div>
  );
}

function money(value: string | number) {
  return `${Number(value ?? 0).toLocaleString('pt-AO')} Kz`;
}
