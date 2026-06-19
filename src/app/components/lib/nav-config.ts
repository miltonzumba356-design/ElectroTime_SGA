import type { ComponentType } from 'react';
import type { UserRole } from './types';
import {
  LayoutDashboard, Users, Building2, Briefcase, MapPin,
  CalendarDays, Clock, ClipboardCheck, FileText, BarChart3,
  Settings, User, Factory, BookOpen, FileSignature,
  DollarSign, CalendarX, CalendarOff, Stamp, CheckSquare,
  AlertCircle, UserPlus, ShieldCheck, ClipboardList,
} from 'lucide-react';

export interface NavItem {
  to: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
  exact?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export type RoleNavConfig = NavSection[];

export const ROLE_NAV: Record<UserRole, RoleNavConfig> = {

  // ----------------------------------------------------------------
  // DONO SAAS — 2 módulos: empresas + auditoria
  // ----------------------------------------------------------------
  saas_owner: [
    {
      items: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
        { to: '/companies', icon: Factory, label: 'Empresas' },
        { to: '/audit', icon: BookOpen, label: 'Auditoria' },
      ],
    },
    {
      title: 'Sistema',
      items: [
        { to: '/profile', icon: User, label: 'Perfil' },
      ],
    },
  ],

  // ----------------------------------------------------------------
  // ADMINISTRADOR — configurador de estrutura + aprovação/utilizadores
  // ----------------------------------------------------------------
  admin: [
    {
      items: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
      ],
    },
    {
      title: 'Estrutura',
      items: [
        { to: '/departments', icon: Building2, label: 'Departamentos' },
        { to: '/roles', icon: Briefcase, label: 'Cargos' },
        { to: '/posts', icon: MapPin, label: 'Postos' },
      ],
    },
    {
      title: 'Jornada',
      items: [
        { to: '/schedules', icon: CalendarDays, label: 'Escalas' },
        { to: '/timetables', icon: Clock, label: 'Horários' },
        { to: '/geofencing-config', icon: ShieldCheck, label: 'Geofencing' },
      ],
    },
    {
      title: 'Gestão',
      items: [
        { to: '/employees', icon: Users, label: 'Colaboradores' },
        { to: '/user-management', icon: UserPlus, label: 'Utilizadores' },
      ],
    },
    {
      title: 'Sistema',
      items: [
        { to: '/settings', icon: Settings, label: 'Configurações' },
        { to: '/profile', icon: User, label: 'Perfil' },
      ],
    },
  ],

  // ----------------------------------------------------------------
  // RH — 9 secções, lógica de negócio de pessoas
  // ----------------------------------------------------------------
  hr: [
    {
      items: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
      ],
    },
    {
      title: 'Pessoas',
      items: [
        { to: '/employees', icon: Users, label: 'Funcionários' },
        { to: '/contracts', icon: FileSignature, label: 'Contratos' },
      ],
    },
    {
      title: 'Vencimentos',
      items: [
        { to: '/payroll', icon: DollarSign, label: 'Folha de Salário' },
      ],
    },
    {
      title: 'Tempo',
      items: [
        { to: '/vacations', icon: CalendarX, label: 'Férias e Faltas' },
        { to: '/holidays', icon: CalendarOff, label: 'Feriados' },
        { to: '/attendance', icon: ClipboardCheck, label: 'Presenças' },
      ],
    },
    {
      title: 'Comunicação',
      items: [
        { to: '/declarations', icon: Stamp, label: 'Declarações' },
      ],
    },
    {
      title: 'Análise',
      items: [
        { to: '/reports', icon: BarChart3, label: 'Relatórios' },
      ],
    },
    {
      title: 'Sistema',
      items: [
        { to: '/settings', icon: Settings, label: 'Configurações' },
        { to: '/profile', icon: User, label: 'Perfil' },
      ],
    },
  ],

  // ----------------------------------------------------------------
  // SUPERVISOR — operacional, restrito ao seu departamento
  // ----------------------------------------------------------------
  supervisor: [
    {
      items: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
      ],
    },
    {
      title: 'Operação',
      items: [
        { to: '/geofencing-auth', icon: AlertCircle, label: 'Presenças Pendentes', badge: 2 },
        { to: '/attendance', icon: ClipboardCheck, label: 'Presenças' },
        { to: '/absence-registration', icon: CalendarX, label: 'Registo de Faltas' },
      ],
    },
    {
      title: 'Equipa',
      items: [
        { to: '/employees', icon: Users, label: 'Funcionários' },
        { to: '/tasks', icon: CheckSquare, label: 'Tarefas' },
        { to: '/schedules', icon: CalendarDays, label: 'Escalas' },
        { to: '/timetables', icon: Clock, label: 'Horários' },
      ],
    },
    {
      title: 'Gestão',
      items: [
        { to: '/requests', icon: FileText, label: 'Solicitações' },
        { to: '/reports', icon: BarChart3, label: 'Relatórios' },
      ],
    },
    {
      title: 'Sistema',
      items: [
        { to: '/profile', icon: User, label: 'Perfil' },
      ],
    },
  ],

  // ----------------------------------------------------------------
  // MANAGER — visão do departamento
  // ----------------------------------------------------------------
  manager: [
    {
      items: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
      ],
    },
    {
      title: 'Equipa',
      items: [
        { to: '/employees', icon: Users, label: 'Funcionários' },
        { to: '/attendance', icon: ClipboardCheck, label: 'Presenças' },
      ],
    },
    {
      title: 'Gestão',
      items: [
        { to: '/requests', icon: FileText, label: 'Solicitações' },
        { to: '/reports', icon: BarChart3, label: 'Relatórios' },
      ],
    },
    {
      title: 'Sistema',
      items: [
        { to: '/profile', icon: User, label: 'Perfil' },
      ],
    },
  ],
};

export const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string; dot: string }> = {
  saas_owner: { bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500/20', dot: 'bg-violet-500' },
  admin:      { bg: 'bg-blue-500/10',   text: 'text-blue-500',   border: 'border-blue-500/20',   dot: 'bg-blue-500' },
  hr:         { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
  supervisor: { bg: 'bg-amber-500/10',  text: 'text-amber-600',  border: 'border-amber-500/20',  dot: 'bg-amber-500' },
  manager:    { bg: 'bg-sky-500/10',    text: 'text-sky-500',    border: 'border-sky-500/20',    dot: 'bg-sky-500' },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  saas_owner: 'Dono SaaS',
  admin:      'Administrador',
  hr:         'Recursos Humanos',
  supervisor: 'Supervisor',
  manager:    'Gestor',
};
