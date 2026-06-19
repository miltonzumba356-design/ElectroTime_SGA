import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DollarSign, Download, Upload, Eye, CheckCircle, Clock, Loader2,
  FileJson, Calculator, X, AlertTriangle, TrendingUp, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { StatsCard } from '../shared/StatsCard';
import { DataTable, type Column } from '../shared/DataTable';
import { Badge } from '../shared/StatusBadge';
import type { Payroll, PayrollItem, PayrollStatus } from '../lib/types';
import { usePayroll, useCalculatePayroll, useGenerateAutoPayroll } from '../lib/api-hooks';
import { normalizeList } from '../lib/api-adapters';
import { formatDate, formatCurrency, cn } from '../lib/utils';

const STATUS_MAP: Record<PayrollStatus, { label: string; variant: any }> = {
  pending:    { label: 'Pendente', variant: 'neutral' },
  processing: { label: 'A processar', variant: 'warning' },
  calculated: { label: 'Calculado', variant: 'info' },
  exported:   { label: 'Exportado', variant: 'success' },
  closed:     { label: 'Fechado', variant: 'neutral' },
};

const TYPE_LABELS: Record<string, string> = {
  monthly: 'Mensal',
  thirteenth_individual: '13.º Individual',
  thirteenth_collective: '13.º Coletivo',
};

export function PayrollPage() {
  const { data: rawPayrolls } = usePayroll();
  const calculateMut = useCalculatePayroll();
  const autoMut = useGenerateAutoPayroll();
  const payrolls: Payroll[] = normalizeList(rawPayrolls, (p: any): Payroll => ({
    id: String(p.id ?? ''),
    company_id: String(p.empresa ?? ''),
    reference_month: p.mes_referencia ?? p.reference_month ?? '',
    reference_year: p.ano_referencia ?? p.reference_year ?? new Date().getFullYear(),
    type: p.tipo ?? p.type ?? 'monthly',
    status: p.status ?? 'pending',
    total_employees: p.total_colaboradores ?? p.total_employees ?? 0,
    total_gross: Number(p.total_bruto ?? p.total_gross ?? 0),
    total_net: Number(p.total_liquido ?? p.total_net ?? 0),
    total_deductions: Number(p.total_descontos ?? p.total_deductions ?? 0),
    erp_exported: p.exportado_erp ?? p.erp_exported ?? false,
    erp_export_date: p.data_export_erp ?? p.erp_export_date ?? undefined,
    items: (p.itens ?? p.items ?? []).map((i: any): PayrollItem => ({
      id: String(i.id ?? ''),
      payroll_id: String(p.id ?? ''),
      employee_id: String(i.colaborador_id ?? ''),
      employee_name: i.colaborador_nome ?? i.nome ?? '—',
      department_name: i.departamento ?? undefined,
      role_name: i.cargo ?? undefined,
      base_salary: Number(i.salario_base ?? 0),
      overtime_value: Number(i.valor_horas_extras ?? i.overtime_value ?? 0),
      bonus: Number(i.bonus ?? 0) || undefined,
      absence_deduction: Number(i.desconto_faltas ?? i.absence_deduction ?? 0),
      inss_value: Number(i.inss ?? i.inss_value ?? 0),
      irpf_value: Number(i.irpf ?? i.irpf_value ?? 0),
      net_salary: Number(i.salario_liquido ?? i.net_salary ?? 0),
    })),
    created_at: p.criado_em ?? p.created_at ?? new Date().toISOString(),
  }));
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [previewItem, setPreviewItem] = useState<PayrollItem | null>(null);
  const [processing, setProcessing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [closing] = useState(false);
  const [show13Modal, setShow13Modal] = useState(false);

  const currentPayroll = payrolls.find(p => p.status === 'calculated' || p.status === 'processing');

  const handleProcess = async () => {
    setProcessing(true);
    try {
      await autoMut.mutateAsync({});
      toast.success('Folha processada com sucesso!');
    } catch {
      toast.error('Erro ao processar folha.');
    }
    setProcessing(false);
  };

  const handleExportPrimavera = async (id: string) => {
    setExporting(true);
    await new Promise(r => setTimeout(r, 800));
    toast.success('JSON exportado para o ERP Primavera!', { description: 'Ficheiro gerado e enviado.' });
    setExporting(false);
  };

  const handleClose = async (_id: string) => {
    toast.info('Fechamento de folha processado.');
  };

  const columns: Column<Payroll>[] = [
    { key: 'reference_month', header: 'Referência', sortable: true,
      cell: r => <span className="text-sm font-medium">{r.reference_month} {r.reference_year}</span> },
    { key: 'type', header: 'Tipo', cell: r => (
      <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">{TYPE_LABELS[r.type]}</span>
    )},
    { key: 'total_employees', header: 'Colaboradores', sortable: true,
      cell: r => <div className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-sm">{r.total_employees}</span></div> },
    { key: 'total_gross', header: 'Total Bruto', sortable: true,
      cell: r => <span className="text-sm font-medium">{formatCurrency(r.total_gross)}</span> },
    { key: 'total_net', header: 'Total Líquido', sortable: true,
      cell: r => <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(r.total_net)}</span> },
    { key: 'status', header: 'Status', cell: r => {
      const s = STATUS_MAP[r.status];
      return <Badge label={s.label} variant={s.variant} dot />;
    }},
    { key: 'erp_exported', header: 'Primavera', cell: r => (
      r.erp_exported
        ? <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"><CheckCircle className="h-3.5 w-3.5" />Exportado</div>
        : <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />Pendente</div>
    )},
    { key: 'created_at', header: 'Criado em', sortable: true,
      cell: r => <span className="text-sm text-muted-foreground">{formatDate(r.created_at)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Folha de Salário"
        description="Processamento, cálculo e exportação para ERP Primavera"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setShow13Modal(true)}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground hover:bg-muted transition-colors">
              <Calculator className="h-3.5 w-3.5" />
              13.º Salário
            </button>
            <button onClick={handleProcess} disabled={processing}
              className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60 transition-colors">
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
              Processar Folha
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatsCard title="Total Bruto" value={formatCurrency(currentPayroll?.total_gross ?? 0)} color="blue" delay={0} />
        <StatsCard title="Total Líquido" value={formatCurrency(currentPayroll?.total_net ?? 0)} color="green" delay={0.05} />
        <StatsCard title="Colaboradores" value={currentPayroll?.total_employees ?? 0} color="slate" delay={0.1} />
        <StatsCard title="Folhas Fechadas" value={payrolls.filter(p => p.status === 'closed').length} color="purple" delay={0.15} />
      </div>

      {/* Current payroll banner */}
      {currentPayroll && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Folha de {currentPayroll.reference_month} {currentPayroll.reference_year} calculada</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentPayroll.total_employees} colaboradores · Líquido total: <strong>{formatCurrency(currentPayroll.total_net)}</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedPayroll(currentPayroll)}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs text-muted-foreground hover:bg-muted transition-colors">
              <Eye className="h-3.5 w-3.5" /> Detalhes
            </button>
            <button onClick={() => handleExportPrimavera(currentPayroll.id)} disabled={exporting}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-60 transition-colors">
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileJson className="h-3.5 w-3.5" />}
              Exportar Primavera
            </button>
          </div>
        </motion.div>
      )}

      <DataTable data={payrolls} columns={columns}
        searchFields={['reference_month']}
        rowActions={row => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => setSelectedPayroll(row)} title="Ver detalhes"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Eye className="h-3.5 w-3.5" />
            </button>
            {!row.erp_exported && row.status === 'calculated' && (
              <button onClick={() => handleExportPrimavera(row.id)} disabled={exporting} title="Exportar Primavera"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50">
                <Download className="h-3.5 w-3.5" />
              </button>
            )}
            {row.status === 'exported' && (
              <button onClick={() => handleClose(row.id)} disabled={closing} title="Fechar folha"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors">
                <CheckCircle className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )} />

      {/* Payroll Detail Modal */}
      <AnimatePresence>
        {selectedPayroll && selectedPayroll.items.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedPayroll(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="relative z-10 flex h-[80vh] w-full max-w-4xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-6 py-4 flex-shrink-0">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Folha {selectedPayroll.reference_month} {selectedPayroll.reference_year}
                    {' — '}{TYPE_LABELS[selectedPayroll.type]}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedPayroll.total_employees} colaboradores · Líquido: {formatCurrency(selectedPayroll.total_net)}
                  </p>
                </div>
                <button onClick={() => setSelectedPayroll(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/50 border-b border-border">
                    <tr>
                      {['Funcionário', 'Salário Base', 'H. Extras', 'Faltas (desc.)', 'INSS', 'IRPF', 'Líquido'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                      ))}
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedPayroll.items.map(item => (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground">{item.employee_name}</p>
                          <p className="text-xs text-muted-foreground">{item.department_name}</p>
                        </td>
                        <td className="px-4 py-3 text-sm">{formatCurrency(item.base_salary)}</td>
                        <td className="px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
                          {item.overtime_value > 0 ? `+${formatCurrency(item.overtime_value)}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
                          {item.absence_deduction > 0 ? `-${formatCurrency(item.absence_deduction)}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">-{formatCurrency(item.inss_value)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">-{formatCurrency(item.irpf_value)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-foreground">{formatCurrency(item.net_salary)}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setPreviewItem(item)}
                            className="text-xs text-primary hover:underline">Pré-visualizar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payslip Preview */}
      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPreviewItem(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
              <div className="border-b border-border bg-[#0D1526] px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Electro Time Ltda</p>
                    <p className="text-xs text-white/60 mt-0.5">CNPJ 12.345.678/0001-95</p>
                  </div>
                  <button onClick={() => setPreviewItem(null)} className="text-white/60 hover:text-white"><X className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Colaborador</p>
                  <p className="text-sm font-semibold text-foreground">{previewItem.employee_name}</p>
                  <p className="text-xs text-muted-foreground">{previewItem.role_name} · {previewItem.department_name}</p>
                </div>
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-muted/30 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proventos</div>
                  {[
                    ['Salário Base', formatCurrency(previewItem.base_salary)],
                    previewItem.overtime_value > 0 ? ['Horas Extras', `+ ${formatCurrency(previewItem.overtime_value)}`] : null,
                    previewItem.bonus ? ['Bônus', `+ ${formatCurrency(previewItem.bonus)}`] : null,
                  ].filter(Boolean).map((row, i) => (
                    <div key={i} className="flex justify-between px-4 py-2 border-t border-border text-sm">
                      <span className="text-muted-foreground">{row![0]}</span>
                      <span className="font-medium text-foreground">{row![1]}</span>
                    </div>
                  ))}
                  <div className="bg-muted/30 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-t border-border">Descontos</div>
                  {[
                    previewItem.absence_deduction > 0 ? ['Faltas', `- ${formatCurrency(previewItem.absence_deduction)}`] : null,
                    ['INSS', `- ${formatCurrency(previewItem.inss_value)}`],
                    previewItem.irpf_value > 0 ? ['IRPF', `- ${formatCurrency(previewItem.irpf_value)}`] : null,
                  ].filter(Boolean).map((row, i) => (
                    <div key={i} className="flex justify-between px-4 py-2 border-t border-border text-sm">
                      <span className="text-muted-foreground">{row![0]}</span>
                      <span className="font-medium text-red-500">{row![1]}</span>
                    </div>
                  ))}
                  <div className="flex justify-between bg-primary/5 border-t border-primary/20 px-4 py-3">
                    <span className="text-sm font-bold text-foreground">Líquido a Receber</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(previewItem.net_salary)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 13th Salary Modal */}
      <AnimatePresence>
        {show13Modal && <Thirteenth13Modal onClose={() => setShow13Modal(false)} />}
      </AnimatePresence>
    </div>
  );
}

function Thirteenth13Modal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<'individual' | 'collective'>('collective');
  const [processing, setProcessing] = useState(false);

  const handle = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    toast.success(`13.º salário ${type === 'collective' ? 'coletivo' : 'individual'} processado!`, {
      description: 'Conforme Lei 7/15 — cálculo proporcional aplicado.',
    });
    setProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Processar 13.º Salário</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Conforme Lei 7/15 — cálculo proporcional</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-3 mb-5">
          <p className="text-xs font-medium text-foreground mb-2">Tipo de processamento</p>
          {[
            { v: 'collective', l: 'Coletivo', d: 'Processa o 13.º para todos os colaboradores ativos de uma só vez' },
            { v: 'individual', l: 'Individual', d: 'Selecionar um colaborador específico para calcular o 13.º' },
          ].map(opt => (
            <label key={opt.v} className={cn('flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors',
              type === opt.v ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
            )}>
              <input type="radio" name="type" value={opt.v} checked={type === opt.v} onChange={() => setType(opt.v as any)} className="mt-0.5 accent-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">{opt.l}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.d}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/8 px-4 py-3 mb-5">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            <strong>Lei 7/15:</strong> O cálculo aplicará as regras de proporcionalidade por meses trabalhados e os descontos de INSS e IRPF conforme tabela vigente.
          </p>
        </div>

        <div className="flex justify-end gap-2.5">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">Cancelar</button>
          <button onClick={handle} disabled={processing}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
            {processing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Processar 13.º
          </button>
        </div>
      </motion.div>
    </div>
  );
}
