import { useState } from 'react';
import { UserCheck, UserX, Clock, TrendingUp } from 'lucide-react';
import { PageHeader } from '../shared/PageHeader';
import { StatsCard } from '../shared/StatsCard';
import { DataTable, type Column } from '../shared/DataTable';
import { formatDate, cn } from '../lib/utils';
import { useAbsenceReport } from '../lib/api-hooks';
import { normalizeList } from '../lib/api-adapters';

interface AbsenceRow {
  id: string;
  employee_name: string;
  department_name?: string;
  total_faltas: number;
  dias?: string[];
}

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'absent', label: 'Com Faltas' },
];

export function AttendancePage() {
  const { data: rawReport, isLoading } = useAbsenceReport();
  const [statusFilter, setStatusFilter] = useState<'all' | 'absent'>('all');

  const rows: AbsenceRow[] = normalizeList(rawReport, (r: any): AbsenceRow => ({
    id: String(r.id ?? r.colaborador_id ?? Math.random()),
    employee_name: r.colaborador ?? r.colaborador_nome ?? r.nome ?? '—',
    department_name: r.departamento ?? undefined,
    total_faltas: r.total_faltas ?? r.total ?? 0,
    dias: r.dias ?? [],
  }));

  const filtered = statusFilter === 'absent' ? rows.filter(r => r.total_faltas > 0) : rows;
  const totalAbsences = rows.reduce((s, r) => s + r.total_faltas, 0);
  const withAbsences = rows.filter(r => r.total_faltas > 0).length;

  const columns: Column<AbsenceRow>[] = [
    { key: 'employee_name', header: 'Funcionário', sortable: true,
      cell: r => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
            {r.employee_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{r.employee_name}</p>
            {r.department_name && <p className="text-xs text-muted-foreground">{r.department_name}</p>}
          </div>
        </div>
      ),
    },
    { key: 'department_name', header: 'Departamento', sortable: true, cell: r => <span className="text-sm">{r.department_name ?? '—'}</span> },
    { key: 'total_faltas', header: 'Total de Faltas', sortable: true,
      cell: r => (
        <span className={cn('text-sm font-medium', r.total_faltas > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
          {r.total_faltas}
        </span>
      ),
    },
    { key: 'dias', header: 'Datas',
      cell: r => (
        <div className="flex flex-wrap gap-1">
          {(r.dias ?? []).slice(0, 3).map((d: string, i: number) => (
            <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{formatDate(d)}</span>
          ))}
          {(r.dias ?? []).length > 3 && <span className="text-xs text-muted-foreground">+{(r.dias ?? []).length - 3}</span>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Controle de Presenças"
        description={`Relatório de faltas — ${formatDate(new Date())}`}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatsCard title="Total de Funcionários" value={rows.length} icon={<UserCheck className="h-5 w-5" />} color="green" delay={0} />
        <StatsCard title="Com Faltas" value={withAbsences} icon={<UserX className="h-5 w-5" />} color="red" delay={0.05} />
        <StatsCard title="Total de Faltas" value={totalAbsences} icon={<Clock className="h-5 w-5" />} color="yellow" delay={0.1} />
        <StatsCard title="Média de Faltas" value={rows.length ? (totalAbsences / rows.length).toFixed(1) : '0'} icon={<TrendingUp className="h-5 w-5" />} color="purple" delay={0.15} />
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTER_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => setStatusFilter(opt.value as any)}
            className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              statusFilter === opt.value ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground')}>
            {opt.label}
          </button>
        ))}
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        searchFields={['employee_name', 'department_name']}
        emptyTitle={isLoading ? 'Carregando...' : 'Nenhum registro de falta'}
        emptyDescription="Não há registros para os filtros selecionados."
      />
    </div>
  );
}
