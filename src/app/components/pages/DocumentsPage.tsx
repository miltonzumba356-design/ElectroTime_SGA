import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { Plus, FileText, X, Loader2, Eye, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { DataTable, type Column } from '../shared/DataTable';
import { StatsCard } from '../shared/StatsCard';
import { useDocuments, useCreateDocument, useEmployees } from '../lib/api-hooks';
import { adaptEmployee, normalizeList } from '../lib/api-adapters';
import { formatDate, cn } from '../lib/utils';

const DOC_TYPE_LABELS: Record<string, string> = {
  contrato: 'Contrato',
  declaracao: 'Declaracao',
  atestado: 'Atestado',
  certificado: 'Certificado',
  outros: 'Outros',
};

interface Doc {
  id: string;
  employee_name: string;
  employee_id: string;
  type: string;
  title: string;
  description: string;
  file_url: string;
  created_at: string;
}

function adaptDoc(d: any): Doc {
  return {
    id: String(d.id ?? ''),
    employee_name: d.colaborador_nome ?? d.employee_name ?? '—',
    employee_id: String(d.colaborador_id ?? d.employee_id ?? ''),
    type: d.tipo ?? d.type ?? 'outros',
    title: d.titulo ?? d.title ?? '—',
    description: d.descricao ?? d.description ?? '',
    file_url: d.ficheiro ?? d.file_url ?? '',
    created_at: d.criado_em ?? d.created_at ?? new Date().toISOString(),
  };
}

export function DocumentsPage() {
  const { data: rawDocs, isLoading } = useDocuments();
  const createMut = useCreateDocument();
  const { data: rawEmployees } = useEmployees();

  const docs: Doc[] = normalizeList(rawDocs, adaptDoc);
  const employees = normalizeList(rawEmployees, adaptEmployee);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const byType = (t: string) => docs.filter(d => d.type === t).length;

  const columns: Column<Doc>[] = [
    {
      key: 'title',
      header: 'Documento',
      sortable: true,
      cell: r => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{r.title}</p>
            <p className="text-xs text-muted-foreground">{DOC_TYPE_LABELS[r.type] ?? r.type}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'employee_name',
      header: 'Funcionario',
      sortable: true,
      cell: r => <span className="text-sm">{r.employee_name}</span>,
    },
    {
      key: 'type',
      header: 'Tipo',
      cell: r => (
        <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
          {DOC_TYPE_LABELS[r.type] ?? r.type}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Data',
      sortable: true,
      cell: r => <span className="text-sm text-muted-foreground">{formatDate(r.created_at)}</span>,
    },
  ];

  const handleCreate = async (data: any) => {
    try {
      await createMut.mutateAsync({
        colaborador_id: Number(data.employee_id),
        tipo: data.type,
        titulo: data.title,
        descricao: data.description ?? '',
      });
      toast.success('Documento criado com sucesso.');
      setDrawerOpen(false);
    } catch {
      toast.error('Erro ao criar documento.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentos"
        description="Gerir documentos dos funcionarios"
        actions={
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Novo Documento
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatsCard title="Total" value={docs.length} color="blue" delay={0} />
        <StatsCard title="Contratos" value={byType('contrato')} color="green" delay={0.05} />
        <StatsCard title="Declaracoes" value={byType('declaracao')} color="purple" delay={0.1} />
        <StatsCard title="Outros" value={docs.length - byType('contrato') - byType('declaracao')} color="slate" delay={0.15} />
      </div>

      <DataTable
        data={docs}
        columns={columns}
        searchFields={['title', 'employee_name']}
        loading={isLoading}
        empty={
          <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
            <FolderOpen className="h-10 w-10 opacity-30" />
            <p className="text-sm">Nenhum documento registado</p>
          </div>
        }
        rowActions={row =>
          row.file_url ? (
            <a
              href={row.file_url}
              target="_blank"
              rel="noreferrer"
              title="Ver documento"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
            </a>
          ) : null
        }
      />

      <AnimatePresence>
        {drawerOpen && (
          <DocumentDrawer
            employees={employees}
            onClose={() => setDrawerOpen(false)}
            onSave={handleCreate}
            loading={createMut.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DocumentDrawer({
  employees,
  onClose,
  onSave,
  loading,
}: {
  employees: { id: string; name: string; status: string }[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  loading: boolean;
}) {
  const { register, handleSubmit } = useForm({ defaultValues: { type: 'outros' } });
  const ic = 'h-9 w-full rounded-lg border border-border bg-input-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30';
  const F = ({ l, children }: { l: string; children: React.ReactNode }) => (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-foreground">{l}</label>
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative z-10 flex h-full w-full max-w-md flex-col bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Novo Documento</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-4 px-6 py-5">
            <F l="Funcionario">
              <select {...register('employee_id', { required: true })} className={ic}>
                <option value="">Selecione...</option>
                {employees
                  .filter(e => e.status === 'active')
                  .map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
              </select>
            </F>
            <F l="Tipo de documento">
              <select {...register('type', { required: true })} className={ic}>
                {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </F>
            <F l="Titulo">
              <input
                {...register('title', { required: true })}
                placeholder="Certificado de Trabalho"
                className={ic}
              />
            </F>
            <F l="Descricao">
              <textarea
                {...register('description')}
                rows={4}
                placeholder="Descricao do documento..."
                className={cn(ic, 'h-auto resize-none py-2')}
              />
            </F>
          </div>

          <div className="border-t border-border px-6 py-4 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Criar
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
