import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import {
  AlertCircle, Building2, CalendarDays, CheckCircle2, ClipboardCheck,
  ClipboardList, Clock, FileSignature, Landmark, MapPin, Shield,
  TimerReset, UserCheck, UserPlus, Users, XCircle,
} from 'lucide-react';
import { StatsCard } from '../shared/StatsCard';
import { PageHeader } from '../shared/PageHeader';
import { useAppStore } from '../store/app.store';
import {
  useAbsenceReport,
  useAbsences,
  useAdminDepartments,
  useAdminSupervisors,
  useCompanies,
  useContracts,
  useEmployeeRequests,
  useEmployees,
  useGlobalSchedule,
  usePayroll,
  usePendingPresences,
  usePosts,
  useSaasLogsLast30Days,
  useSaasPendingRequests,
  useSaasRequestsSummary,
  useSchedules,
  useSupervisorEmployees,
  useVacations,
  useWorkPlan,
} from '../lib/api-hooks';
import { formatDate } from '../lib/utils';
import { normalizeList } from '../lib/api-adapters';
import { normalizeUserRole, ROLE_LABELS } from '../lib/nav-config';
import type { UserRole } from '../lib/types';

export function DashboardPage() {
  const user = useAppStore(s => s.user);
  const role = normalizeUserRole(user?.role);

  switch (role) {
    case 'dono_saas':
      return <SaasOwnerDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'rh':
      return <RhDashboard />;
    case 'supervisor':
      return <SupervisorDashboard />;
    case 'chefe_departamento':
      return <DepartmentChiefDashboard />;
    default:
      return <CollaboratorDashboard />;
  }
}

function SaasOwnerDashboard() {
  const { data: companiesRaw, isLoading: loadingCompanies } = useCompanies();
  const { data: pendingRaw, isLoading: loadingPending } = useSaasPendingRequests();
  const { data: summaryRaw } = useSaasRequestsSummary();
  const { data: logsRaw } = useSaasLogsLast30Days();

  const companies = normalizeList(companiesRaw, (c: any) => c);
  const pending = normalizeList((pendingRaw as any)?.solicitacoes ?? pendingRaw, (r: any) => r);
  const logs = normalizeList(logsRaw, (l: any) => l);
  const summary = (summaryRaw ?? {}) as any;

  return (
    <DashboardShell
      title="Dashboard SaaS"
      description="Solicitacoes de empresas, base de clientes e auditoria da plataforma"
      loading={loadingCompanies || loadingPending}
      stats={[
        { title: 'Empresas cadastradas', value: countFrom(companiesRaw, companies.length), icon: <Building2 className="h-5 w-5" />, color: 'blue' },
        { title: 'Solicitacoes pendentes', value: summary.pendentes ?? pending.length, icon: <AlertCircle className="h-5 w-5" />, color: 'yellow' },
        { title: 'Aprovadas', value: summary.aprovadas ?? 0, icon: <CheckCircle2 className="h-5 w-5" />, color: 'green' },
        { title: 'Rejeitadas', value: summary.rejeitadas ?? 0, icon: <XCircle className="h-5 w-5" />, color: 'red' },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel title="Solicitacoes pendentes" actionHref="#/companies" actionLabel="Gerir empresas">
          <SimpleList
            empty="Sem solicitacoes pendentes."
            items={pending.slice(0, 5).map((s: any) => ({
              title: s.nome_empresa ?? s.empresa?.nome ?? `Solicitacao #${s.id}`,
              meta: s.email_empresa ?? s.empresa?.email ?? s.status_display ?? 'Pendente',
              badge: s.status_display ?? s.status ?? 'pendente',
            }))}
          />
        </DashboardPanel>
        <DashboardPanel title="Auditoria recente" actionHref="#/audit" actionLabel="Ver auditoria">
          <SimpleList
            empty="Sem logs recentes."
            items={logs.slice(0, 5).map((l: any) => ({
              title: l.acao_display ?? l.acao ?? 'Acao',
              meta: l.descricao ?? l.empresa_nome ?? formatDate(l.criado_em ?? new Date()),
              badge: l.criado_em ? formatDate(l.criado_em) : undefined,
            }))}
          />
        </DashboardPanel>
      </div>
    </DashboardShell>
  );
}

function AdminDashboard() {
  const user = useAppStore(s => s.user);
  const { data: departmentsRaw, isLoading: loadingDepartments } = useAdminDepartments();
  const { data: postsRaw, isLoading: loadingPosts } = usePosts();
  const { data: supervisorsRaw } = useAdminSupervisors();
  const { data: requestsRaw } = useEmployeeRequests();
  const { data: scheduleRaw } = useGlobalSchedule();

  const departments = normalizeList(departmentsRaw, (d: any) => d);
  const posts = normalizeList(postsRaw, (p: any) => p);
  const supervisors = normalizeList(supervisorsRaw, (s: any) => s);
  const requests = normalizeList(requestsRaw, (r: any) => r);
  const schedule = (scheduleRaw ?? {}) as any;

  return (
    <DashboardShell
      title="Dashboard Admin"
      description={`Configuracao e estrutura da empresa ${user?.company_name ?? ''}`}
      loading={loadingDepartments || loadingPosts}
      stats={[
        { title: 'Departamentos', value: departments.length, icon: <Building2 className="h-5 w-5" />, color: 'blue' },
        { title: 'Postos de trabalho', value: posts.length, icon: <MapPin className="h-5 w-5" />, color: 'green' },
        { title: 'Supervisores', value: supervisors.length, icon: <UserCheck className="h-5 w-5" />, color: 'purple' },
        { title: 'Colaboradores pendentes', value: requests.length, icon: <UserPlus className="h-5 w-5" />, color: 'yellow' },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardPanel title="Solicitacoes de colaboradores" actionHref="#/employees" actionLabel="Abrir colaboradores">
          <SimpleList
            empty="Sem pedidos de colaborador."
            items={requests.slice(0, 5).map((r: any) => ({
              title: r.nome ?? r.colaborador ?? r.user?.username ?? `Pedido #${r.id}`,
              meta: r.email ?? r.departamento ?? 'Aguardando aprovacao',
              badge: r.status ?? 'pendente',
            }))}
          />
        </DashboardPanel>
        <DashboardPanel title="Departamentos ativos" actionHref="#/departments" actionLabel="Gerir">
          <SimpleList
            empty="Sem departamentos cadastrados."
            items={departments.slice(0, 5).map((d: any) => ({
              title: d.nome ?? d.name ?? `Departamento #${d.id}`,
              meta: d.responsavel_nome ?? d.descricao ?? 'Sem responsavel',
              badge: d.total_colaboradores ?? d.employee_count,
            }))}
          />
        </DashboardPanel>
        <DashboardPanel title="Horario global">
          <SimpleList
            empty="Horario global ainda nao configurado."
            items={[
              schedule.horario_entrada_padrao || schedule.horario_entrada
                ? {
                    title: `${schedule.horario_entrada_padrao ?? schedule.horario_entrada} - ${schedule.horario_saida_padrao ?? schedule.horario_saida}`,
                    meta: `Almoco: ${schedule.horario_almoco_inicio ?? '--'} - ${schedule.horario_almoco_fim ?? '--'}`,
                    badge: 'Global',
                  }
                : null,
            ].filter(Boolean) as any}
          />
        </DashboardPanel>
      </div>
    </DashboardShell>
  );
}

function RhDashboard() {
  const { data: employeesRaw, isLoading: loadingEmployees } = useEmployees();
  const { data: contractsRaw } = useContracts();
  const { data: payrollRaw } = usePayroll();
  const { data: vacationsRaw } = useVacations('pendente');
  const { data: absencesRaw } = useAbsences();

  const employees = normalizeList(employeesRaw, (e: any) => e);
  const contracts = normalizeList(contractsRaw, (c: any) => c);
  const payroll = normalizeList(payrollRaw, (p: any) => p);
  const vacations = normalizeList(vacationsRaw, (v: any) => v);
  const absences = normalizeList(absencesRaw, (a: any) => a);

  return (
    <DashboardShell
      title="Dashboard RH"
      description="Pessoas, contratos, ferias, faltas e folha salarial"
      loading={loadingEmployees}
      stats={[
        { title: 'Funcionarios', value: employees.length, icon: <Users className="h-5 w-5" />, color: 'blue' },
        { title: 'Contratos', value: contracts.length, icon: <FileSignature className="h-5 w-5" />, color: 'purple' },
        { title: 'Ferias pendentes', value: vacations.length, icon: <CalendarDays className="h-5 w-5" />, color: 'yellow' },
        { title: 'Faltas registadas', value: absences.length, icon: <Clock className="h-5 w-5" />, color: 'red' },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel title="Ferias para processar" actionHref="#/vacations" actionLabel="Abrir ferias">
          <SimpleList
            empty="Sem ferias pendentes."
            items={vacations.slice(0, 5).map((v: any) => ({
              title: v.colaborador_nome ?? v.colaborador ?? v.employee_name ?? `Ferias #${v.id}`,
              meta: `${v.data_inicio ?? v.start_date ?? '--'} ate ${v.data_fim ?? v.end_date ?? '--'}`,
              badge: v.status ?? 'pendente',
            }))}
          />
        </DashboardPanel>
        <DashboardPanel title="Folha e contratos" actionHref="#/payroll" actionLabel="Folha salarial">
          <SimpleList
            empty="Sem recibos ou contratos recentes."
            items={[...payroll.slice(0, 3), ...contracts.slice(0, 2)].map((i: any) => ({
              title: i.colaborador_nome ?? i.employee_name ?? i.titulo ?? i.numero ?? `Registo #${i.id}`,
              meta: i.mes ? `Mes ${i.mes}/${i.ano ?? ''}` : i.data_fim ? `Termina em ${i.data_fim}` : 'Registo de RH',
              badge: i.status ?? i.tipo ?? undefined,
            }))}
          />
        </DashboardPanel>
      </div>
    </DashboardShell>
  );
}

function SupervisorDashboard() {
  const { data: employeesRaw, isLoading: loadingEmployees } = useSupervisorEmployees();
  const { data: pendingRaw, isLoading: loadingPending } = usePendingPresences();
  const { data: absenceRaw } = useAbsenceReport();
  const { data: schedulesRaw } = useSchedules();
  const { data: workPlanRaw } = useWorkPlan();

  const employees = normalizeList(employeesRaw, (e: any) => e);
  const pending = normalizeList((pendingRaw as any)?.pendentes ?? pendingRaw, (p: any) => p);
  const schedules = normalizeList(schedulesRaw, (s: any) => s);
  const absence = (absenceRaw ?? {}) as any;
  const workPlan = (workPlanRaw ?? {}) as any;

  return (
    <DashboardShell
      title="Dashboard Supervisor"
      description="Operacao diaria da equipa, presencas fora do local e escalas"
      loading={loadingEmployees || loadingPending}
      stats={[
        { title: 'Equipa supervisionada', value: employees.length, icon: <Users className="h-5 w-5" />, color: 'blue' },
        { title: 'Presencas pendentes', value: pending.length, icon: <AlertCircle className="h-5 w-5" />, color: 'yellow' },
        { title: 'Faltas no mes', value: absence.total_faltas ?? 0, icon: <Clock className="h-5 w-5" />, color: 'red' },
        { title: 'Escalas', value: schedules.length || workPlan.total_dias_trabalho || 0, icon: <CalendarDays className="h-5 w-5" />, color: 'green' },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel title="Presencas fora do geofencing" actionHref="#/geofencing-auth" actionLabel="Autorizar">
          <SimpleList
            empty="Sem presencas pendentes."
            items={pending.slice(0, 5).map((p: any) => ({
              title: p.colaborador ?? p.employee_name ?? p.nome ?? `Presenca #${p.id}`,
              meta: p.motivo ?? p.observacao ?? p.localizacao ?? 'Aguardando decisao',
              badge: p.status ?? 'pendente',
            }))}
          />
        </DashboardPanel>
        <DashboardPanel title="Faltas recentes" actionHref="#/absence-registration" actionLabel="Registar falta">
          <SimpleList
            empty="Sem faltas no periodo."
            items={(absence.faltas ?? []).slice(0, 5).map((f: any) => ({
              title: f.colaborador ?? f.employee_name ?? 'Colaborador',
              meta: f.data ?? 'Sem data',
              badge: f.tipo ?? f.tipo_falta,
            }))}
          />
        </DashboardPanel>
      </div>
    </DashboardShell>
  );
}

function DepartmentChiefDashboard() {
  const { data: employeesRaw, isLoading: loadingEmployees } = useSupervisorEmployees();
  const { data: absenceRaw } = useAbsenceReport();
  const { data: pendingRaw } = usePendingPresences();

  const employees = normalizeList(employeesRaw, (e: any) => e);
  const pending = normalizeList((pendingRaw as any)?.pendentes ?? pendingRaw, (p: any) => p);
  const absence = (absenceRaw ?? {}) as any;

  return (
    <DashboardShell
      title="Dashboard Chefe de Departamento"
      description="Resumo da equipa, presencas e solicitacoes do departamento"
      loading={loadingEmployees}
      stats={[
        { title: 'Colaboradores da equipa', value: employees.length, icon: <Users className="h-5 w-5" />, color: 'blue' },
        { title: 'Faltas no mes', value: absence.total_faltas ?? 0, icon: <Clock className="h-5 w-5" />, color: 'red' },
        { title: 'Presencas a rever', value: pending.length, icon: <ClipboardCheck className="h-5 w-5" />, color: 'yellow' },
        { title: 'Departamento', value: employees[0]?.departamento ?? employees[0]?.department_name ?? '-', icon: <Landmark className="h-5 w-5" />, color: 'slate' },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel title="Equipa direta" actionHref="#/employees" actionLabel="Ver equipa">
          <SimpleList
            empty="Sem colaboradores para apresentar."
            items={employees.slice(0, 6).map((e: any) => ({
              title: e.nome ?? e.name ?? e.user?.username ?? `Colaborador #${e.id}`,
              meta: e.cargo ?? e.role_name ?? e.email ?? 'Sem funcao',
              badge: e.status ?? e.ativo,
            }))}
          />
        </DashboardPanel>
        <DashboardPanel title="Ocorrencias do departamento" actionHref="#/reports" actionLabel="Relatorios">
          <SimpleList
            empty="Sem ocorrencias recentes."
            items={(absence.faltas ?? []).slice(0, 5).map((f: any) => ({
              title: f.colaborador ?? 'Colaborador',
              meta: f.data ?? 'Sem data',
              badge: f.tipo ?? 'falta',
            }))}
          />
        </DashboardPanel>
      </div>
    </DashboardShell>
  );
}

function CollaboratorDashboard() {
  const user = useAppStore(s => s.user);

  return (
    <DashboardShell
      title="Dashboard Colaborador"
      description="Resumo pessoal de acesso e perfil"
      stats={[
        { title: 'Perfil', value: ROLE_LABELS.colaborador, icon: <Shield className="h-5 w-5" />, color: 'slate' },
        { title: 'Empresa', value: user?.company_name || '-', icon: <Building2 className="h-5 w-5" />, color: 'blue' },
        { title: 'Estado da sessao', value: 'Ativa', icon: <CheckCircle2 className="h-5 w-5" />, color: 'green' },
        { title: 'Proxima acao', value: 'Perfil', icon: <ClipboardList className="h-5 w-5" />, color: 'purple' },
      ]}
    >
      <DashboardPanel title="Area de colaborador">
        <p className="text-sm leading-6 text-muted-foreground">
          O contrato atual da API exposto no YAML inclui autenticacao e consulta de perfil para este papel, mas nao documenta endpoints completos de autosservico do colaborador. Use a pagina de perfil para consultar os dados da conta autenticada.
        </p>
      </DashboardPanel>
    </DashboardShell>
  );
}

interface StatDef {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'slate';
}

function DashboardShell({
  title,
  description,
  stats,
  loading = false,
  children,
}: {
  title: string;
  description: string;
  stats: StatDef[];
  loading?: boolean;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <TimerReset className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm">Carregando dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={`${description} - ${formatDate(new Date(), 'DD/MM/YYYY')}`} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <StatsCard key={s.title} title={s.title} value={s.value} icon={s.icon} color={s.color} delay={i * 0.04} />
        ))}
      </div>
      {children}
    </div>
  );
}

function DashboardPanel({
  title,
  actionHref,
  actionLabel,
  children,
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {actionHref && actionLabel && (
          <a href={actionHref} className="text-xs font-medium text-primary hover:underline">
            {actionLabel}
          </a>
        )}
      </div>
      {children}
    </motion.section>
  );
}

function SimpleList({
  items,
  empty,
}: {
  items: Array<{ title: string; meta?: string; badge?: string | number | boolean }>;
  empty: string;
}) {
  if (!items.length) {
    return <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">{empty}</div>;
  }

  return (
    <div className="divide-y divide-border">
      {items.map((item, i) => (
        <div key={`${item.title}-${i}`} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
            {item.meta && <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.meta}</p>}
          </div>
          {item.badge !== undefined && item.badge !== '' && (
            <span className="flex-shrink-0 rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
              {String(item.badge)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function countFrom(raw: unknown, fallback: number) {
  if (raw && typeof raw === 'object' && 'count' in raw && typeof (raw as any).count === 'number') {
    return (raw as any).count;
  }
  return fallback;
}
