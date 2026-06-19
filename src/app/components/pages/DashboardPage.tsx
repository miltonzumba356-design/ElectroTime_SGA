import { useState } from 'react';
import { motion } from 'motion/react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Users, UserCheck, UserX, Clock, TrendingUp,
  ClipboardList, Building2, ArrowRight, Loader2, Shield,
} from 'lucide-react';
import { StatsCard } from '../shared/StatsCard';
import { PageHeader } from '../shared/PageHeader';
import { useAppStore } from '../store/app.store';
import { useAbsenceReport, useEmployees, useAdminDepartments, usePendingPresences, useVacations } from '../lib/api-hooks';
import { formatDate } from '../lib/utils';
import { canAccessPath, normalizeUserRole } from '../lib/nav-config';
import type { UserRole } from '../lib/types';

const DEPT_COLORS = ['#0057D9', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

export function DashboardPage() {
  const user = useAppStore(s => s.user);
  const role = normalizeUserRole(user?.role);

  if (role === 'colaborador') {
    return <CollaboratorDashboard />;
  }

  return <OperationalDashboard role={role} />;
}

function OperationalDashboard({ role }: { role: UserRole }) {
  const { theme, user } = useAppStore();
  const isDark = theme === 'dark';
  const [chartView, setChartView] = useState<'weekly' | 'attendance'>('weekly');
  const canOpenGeofencingAuth = canAccessPath(role, '/geofencing-auth');

  const chartColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const axisColor  = isDark ? '#4B5563' : '#94A3B8';
  const tooltipStyle = {
    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
    borderRadius: '0.5rem',
    color: isDark ? '#F8FAFC' : '#0F172A',
    fontSize: '12px',
  };

  const { data: employees = [], isLoading: loadingEmpl } = useEmployees();
  const { data: deptRaw,       isLoading: loadingDept } = useAdminDepartments();
  const { data: absReport,     isLoading: loadingAbs  } = useAbsenceReport();
  const { data: pendingPres,   isLoading: loadingPres } = usePendingPresences();
  const { data: vacations = [] } = useVacations('pendente');

  const isLoading = loadingEmpl || loadingDept || loadingAbs || loadingPres;

  // Normalise employees — API may return array or paginated object
  const employeeList: any[] = Array.isArray(employees) ? employees : (employees as any)?.results ?? [];
  const deptList:     any[] = Array.isArray(deptRaw)   ? deptRaw   : (deptRaw   as any)?.results ?? [];
  const pendingList:  any[] = Array.isArray(pendingPres) ? pendingPres : (pendingPres as any)?.pendentes ?? [];
  const vacList:      any[] = Array.isArray(vacations)  ? vacations  : (vacations  as any)?.results ?? [];

  const totalEmployees = employeeList.length;
  const activeCount    = employeeList.filter((e: any) => e.status === 'ativo' || e.status === 'active').length;

  const absData  = absReport as any ?? {};
  const todayAbsent = absData.total_faltas ?? 0;
  const todayFalts  = (absData.faltas ?? []) as any[];

  // Build dept chart from API data
  const deptChart = deptList.slice(0, 6).map((d: any, i: number) => ({
    name: d.nome ?? d.name ?? `Depto ${i + 1}`,
    value: d.total_colaboradores ?? d.employee_count ?? 0,
    color: DEPT_COLORS[i % DEPT_COLORS.length],
  }));

  // Build absence chart from report
  const absenceChartData = todayFalts.slice(0, 7).map((f: any) => ({
    date: f.data ?? '',
    colaborador: f.colaborador ?? '',
    tipo: f.tipo ?? '',
  }));

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm">Carregando dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Visão geral — ${formatDate(new Date(), 'DD/MM/YYYY')}`}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Funcionários"
          value={totalEmployees}
          icon={<Users className="h-5 w-5" />}
          color="blue"
          delay={0}
        />
        <StatsCard
          title="Funcionários Ativos"
          value={activeCount}
          icon={<UserCheck className="h-5 w-5" />}
          color="green"
          description={totalEmployees > 0 ? `${Math.round((activeCount / totalEmployees) * 100)}% do total` : undefined}
          delay={0.05}
        />
        <StatsCard
          title="Faltas no Mês"
          value={todayAbsent}
          icon={<UserX className="h-5 w-5" />}
          color="red"
          delay={0.1}
        />
        <StatsCard
          title="Presenças Pendentes"
          value={pendingList.length}
          icon={<Clock className="h-5 w-5" />}
          color="yellow"
          description="Aguardando autorização"
          delay={0.15}
        />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Departamentos"
          value={deptList.length}
          icon={<Building2 className="h-5 w-5" />}
          color="blue"
          delay={0.2}
        />
        <StatsCard
          title="Solicitações de Férias"
          value={vacList.length}
          icon={<ClipboardList className="h-5 w-5" />}
          color="yellow"
          description="Pendentes de aprovação"
          delay={0.25}
        />
        <StatsCard
          title="Total Faltas (Mês)"
          value={absData.total_faltas ?? 0}
          icon={<TrendingUp className="h-5 w-5" />}
          color="purple"
          delay={0.3}
        />
        <StatsCard
          title="Empresa"
          value={user?.company_name ?? '—'}
          icon={<Building2 className="h-5 w-5" />}
          color="slate"
          delay={0.35}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Absence list as chart substitute */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="lg:col-span-2 rounded-xl border border-border bg-card p-5"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Relatório de Faltas</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {absData.mes}/{absData.ano} — {absData.total_faltas ?? 0} falta(s)
              </p>
            </div>
          </div>

          {todayFalts.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Nenhuma falta registada neste período.
            </div>
          ) : (
            <div className="overflow-auto max-h-56">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 text-left text-muted-foreground font-medium">Colaborador</th>
                    <th className="py-2 text-left text-muted-foreground font-medium">Data</th>
                    <th className="py-2 text-left text-muted-foreground font-medium">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {todayFalts.map((f: any, i: number) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 font-medium text-foreground">{f.colaborador}</td>
                      <td className="py-2.5 text-muted-foreground">{f.data}</td>
                      <td className="py-2.5 text-muted-foreground capitalize">{f.tipo?.replace(/_/g, ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Department Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.45 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Funcionários por Depto.</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Distribuição atual</p>
          </div>

          {deptChart.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={deptChart} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {deptChart.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} func.`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {deptChart.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-muted-foreground truncate max-w-[100px]">{d.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Sem dados de departamentos.
            </div>
          )}
        </motion.div>
      </div>

      {/* Pending presences */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Presenças Fora do Geofencing</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{pendingList.length} pendente(s) de autorização</p>
          </div>
          {canOpenGeofencingAuth && (
            <a href="#/geofencing-auth" className="flex items-center gap-1 text-xs text-primary hover:underline">
              Ver todas <ArrowRight className="h-3 w-3" />
            </a>
          )}
        </div>
        {pendingList.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            Nenhuma presença pendente de autorização.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {pendingList.slice(0, 5).map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <ClipboardList className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.colaborador ?? p.nome ?? `Colaborador #${p.id}`}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.motivo ?? p.observacao ?? 'Sem motivo registado'}</p>
                </div>
                <span className="flex-shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Pendente
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function CollaboratorDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Área de colaborador"
      />
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Endpoints de colaborador não implementados neste painel</h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              O role existe no backend, mas os endpoints de colaborador ficaram fora do escopo solicitado. Use a página de perfil para consultar os dados da conta autenticada.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
