import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { Plus, Eye, X, Loader2, Send, Stamp, CheckCircle, Clock, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { StatsCard } from '../shared/StatsCard';
import { DataTable, type Column } from '../shared/DataTable';
import { Badge } from '../shared/StatusBadge';
import type { Declaration, DeclarationType, DeclarationStatus } from '../lib/types';
import { useDeclarations, useSendDeclaration, useEmployees } from '../lib/api-hooks';
import { normalizeList, adaptEmployee } from '../lib/api-adapters';
import { formatDateTime, cn } from '../lib/utils';

const TYPE_MAP: Record<DeclarationType, { label: string; variant: any; template: string }> = {
  employment: { label: 'Vínculo', variant: 'info', template: 'Declaramos que {NOME}, BI {BI}, encontra-se vinculado(a) a esta empresa desde {DATA_ADMISSÃO}, exercendo a função de {CARGO}.' },
  income:     { label: 'RemuneraÃ§Ã£o', variant: 'success', template: 'Declaramos que {NOME}, BI {BI}, percebe remuneraÃ§Ã£o mensal bruta de {SALÃRIO} nesta empresa.' },
  work:       { label: 'Trabalho', variant: 'default', template: 'Declaramos que {NOME} trabalha em regime presencial com jornada de 44 horas semanais, sem acumular outros vínculos empregatícios.' },
  custom:     { label: 'Personalizada', variant: 'neutral', template: '' },
};

const STATUS_MAP: Record<DeclarationStatus, { label: string; variant: any }> = {
  draft:     { label: 'Rascunho', variant: 'neutral' },
  sent:      { label: 'Enviada', variant: 'info' },
  delivered: { label: 'Entregue', variant: 'success' },
  failed:    { label: 'Falhou', variant: 'error' },
};

export function DeclarationsPage() {
  const { data: rawDeclarations } = useDeclarations();
  const { data: rawEmployees } = useEmployees();
  const sendMut = useSendDeclaration();
  const declarations: Declaration[] = normalizeList(rawDeclarations, (d: any): Declaration => ({
    id: String(d.id ?? ''),
    company_id: String(d.empresa ?? ''),
    employee_id: String(d.colaborador_id ?? d.colaborador ?? ''),
    employee_name: d.colaborador_nome ?? d.nome ?? '—',
    employee_email: d.email ?? d.colaborador_email ?? undefined,
    employee_registration: d.matricula ?? undefined,
    department_name: d.departamento ?? undefined,
    type: d.tipo ?? 'employment',
    subject: d.assunto ?? d.subject ?? '—',
    content: d.conteudo ?? d.content ?? '',
    status: d.status === 'enviada' ? 'sent' : d.status === 'entregue' ? 'delivered' : d.status === 'falhou' ? 'failed' : 'draft',
    sent_at: d.enviado_em ?? d.sent_at ?? undefined,
    delivered_at: d.entregue_em ?? d.delivered_at ?? undefined,
    created_by: d.criado_por ?? d.created_by ?? undefined,
    created_at: d.criado_em ?? d.created_at ?? new Date().toISOString(),
  }));
  const employees = normalizeList(rawEmployees, adaptEmployee);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<Declaration | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  const columns: Column<Declaration>[] = [
    { key: 'employee_name', header: 'Destinatário', sortable: true,
      cell: r => <div><p className="text-sm font-medium text-foreground">{r.employee_name}</p><p className="text-xs text-muted-foreground">{r.employee_email}</p></div> },
    { key: 'type', header: 'Tipo', cell: r => {
      const t = TYPE_MAP[r.type];
      return <Badge label={t.label} variant={t.variant} />;
    }},
    { key: 'subject', header: 'Assunto', cell: r => <span className="text-sm truncate max-w-xs">{r.subject}</span> },
    { key: 'status', header: 'Status', cell: r => {
      const s = STATUS_MAP[r.status];
      return <Badge label={s.label} variant={s.variant} dot />;
    }},
    { key: 'sent_at', header: 'Enviada em', cell: r => (
      r.sent_at ? <span className="text-sm text-muted-foreground">{formatDateTime(r.sent_at)}</span>
                : <span className="text-sm text-muted-foreground">—</span>
    )},
    { key: 'created_by', header: 'Emitido por', cell: r => <span className="text-sm text-muted-foreground">{r.created_by ?? '—'}</span> },
  ];

  const handleResend = async (id: string) => {
    setSending(id);
    try {
      await sendMut.mutateAsync(Number(id));
      toast.success('Declaração enviada com sucesso!', { description: 'Entregue no e-mail do colaborador.' });
    } catch {
      toast.error('Erro ao enviar declaração.');
    }
    setSending(null);
  };

  const onSave = async (data: any) => {
    try {
      await sendMut.mutateAsync(data);
      toast.success('Declaração criada e enviada!');
    } catch {
      toast.error('Erro ao criar declaração.');
    }
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Declarações"
        description="Emissão e envio de declarações via API ao colaborador"
        actions={
          <button onClick={() => setDrawerOpen(true)}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Nova Declaração
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatsCard title="Total" value={declarations.length} color="blue" delay={0} />
        <StatsCard title="Entregues" value={declarations.filter(d => d.status === 'delivered').length} color="green" delay={0.05} />
        <StatsCard title="Enviadas" value={declarations.filter(d => d.status === 'sent').length} color="yellow" delay={0.1} />
        <StatsCard title="Rascunhos" value={declarations.filter(d => d.status === 'draft').length} color="slate" delay={0.15} />
      </div>

      <DataTable data={declarations} columns={columns}
        searchFields={['employee_name', 'subject', 'department_name']}
        rowActions={row => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => setViewTarget(row)} title="Ver declaração"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Eye className="h-3.5 w-3.5" />
            </button>
            {(row.status === 'draft' || row.status === 'failed') && (
              <button onClick={() => handleResend(row.id)} disabled={sending === row.id} title="Enviar via API"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50">
                {sending === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        )} />

      {/* View Modal */}
      <AnimatePresence>
        {viewTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewTarget(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
              {/* Letter header */}
              <div className="bg-[#0D1526] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Stamp className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-sm font-bold text-white">Electro Time Ltda</p>
                    <p className="text-xs text-white/50">NIF 5000000000</p>
                  </div>
                </div>
                <button onClick={() => setViewTarget(null)} className="text-white/60 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{viewTarget.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Para: {viewTarget.employee_name} · {viewTarget.employee_email}</p>
                  </div>
                  <Badge label={STATUS_MAP[viewTarget.status].label} variant={STATUS_MAP[viewTarget.status].variant} dot />
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{viewTarget.content}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Emitido por: <strong className="text-foreground">{viewTarget.created_by}</strong></span>
                  {viewTarget.sent_at && <span>Enviado: {formatDateTime(viewTarget.sent_at)}</span>}
                </div>
                {(viewTarget.status === 'draft' || viewTarget.status === 'failed') && (
                  <button onClick={() => { handleResend(viewTarget.id); setViewTarget(null); }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
                    <Send className="h-4 w-4" /> Enviar agora
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Declaration Drawer */}
      <AnimatePresence>
        {drawerOpen && <DeclarationDrawer employees={employees} onClose={() => setDrawerOpen(false)} onSave={onSave} />}
      </AnimatePresence>
    </div>
  );
}

function DeclarationDrawer({ employees, onClose, onSave }: {
  employees: { id: string; name: string; registration: string; status: string; BI: string; hire_date: string; role_name?: string; email: string }[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [selectedType, setSelectedType] = useState<DeclarationType>('employment');
  const { register, handleSubmit, watch, setValue } = useForm();

  const empId = watch('employee_id');
  const selectedEmp = employees.find(e => e.id === empId);

  const getTemplate = () => {
    if (!selectedEmp) return TYPE_MAP[selectedType].template;
    return TYPE_MAP[selectedType].template
      .replace('{NOME}', selectedEmp.name)
      .replace('{BI}', selectedEmp.BI)
      .replace('{DATA_ADMISSÃƒO}', selectedEmp.hire_date)
      .replace('{CARGO}', selectedEmp.role_name ?? '')
      .replace('{SALÃRIO}', 'Kz X.XXX,00');
  };

  const onSubmit = async (data: any) => {
    setSaving(true);
    await onSave({
      colaborador_id: Number(data.employee_id),
      tipo: selectedType,
      assunto: data.subject,
      conteudo: data.content || getTemplate(),
    });
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
        className="relative z-10 flex h-full w-full max-w-lg flex-col bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Nova Declaração</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Será enviada por e-mail ao colaborador via API.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-4 px-6 py-5">
            <F l="Funcionário">
              <select {...register('employee_id')} className={ic}>
                <option value="">Selecione...</option>
                {employees.filter(e => e.status === 'active').map(e => (
                  <option key={e.id} value={e.id}>{e.name} — {e.registration}</option>
                ))}
              </select>
            </F>
            <div>
              <label className="mb-2 block text-xs font-medium text-foreground">Tipo de Declaração</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(TYPE_MAP) as [DeclarationType, any][]).map(([type, info]) => (
                  <button key={type} type="button" onClick={() => setSelectedType(type)}
                    className={cn('rounded-lg border px-3 py-2.5 text-left transition-colors',
                      selectedType === type ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40')}>
                    <p className={cn('text-xs font-semibold', selectedType === type ? 'text-primary' : 'text-foreground')}>{info.label}</p>
                  </button>
                ))}
              </div>
            </div>
            <F l="Assunto"><input {...register('subject')} placeholder="Declaração de Vínculo Empregatício" className={ic} /></F>
            <F l="Conteúdo">
              <textarea {...register('content')} defaultValue={getTemplate()} rows={6}
                placeholder={getTemplate() || 'Conteúdo da declaração...'}
                className={cn(ic, 'h-auto resize-none py-2')} />
              {selectedType !== 'custom' && (
                <button type="button" onClick={() => setValue('content', getTemplate())}
                  className="mt-1 text-xs text-primary hover:underline">↺ Usar modelo padrão</button>
              )}
            </F>
          </div>
          <div className="border-t border-border px-6 py-4 flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Emitir e Enviar
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
