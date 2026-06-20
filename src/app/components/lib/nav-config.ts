import type { ComponentType } from 'react';
import type { UserRole } from './types';
import {
  LayoutDashboard, Users, Building2, Briefcase, MapPin,
  CalendarDays, Clock, ClipboardCheck, FileText, BarChart3,
  Settings, User, Factory, BookOpen, FileSignature,
  DollarSign, CalendarX, CalendarOff, Stamp, CheckSquare,
  AlertCircle, UserPlus, ShieldCheck, Inbox, CreditCard, ReceiptText,
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

export const ROLE_LABELS: Record<UserRole, string> = {
  dono_saas: 'Dono do SaaS',
  admin: 'Admin da Empresa',
  rh: 'Recursos Humanos',
  supervisor: 'Supervisor',
  chefe_departamento: 'Chefe de Departamento',
  colaborador: 'Colaborador',
};

export const LEGACY_ROLE_MAP: Record<string, UserRole> = {
  dono_saas: 'dono_saas',
  saas_owner: 'dono_saas',
  admin: 'admin',
  rh: 'rh',
  hr: 'rh',
  supervisor: 'supervisor',
  chefe_departamento: 'chefe_departamento',
  gestor: 'chefe_departamento',
  manager: 'chefe_departamento',
  colaborador: 'colaborador',
};

export function normalizeUserRole(role?: string | null): UserRole {
  return LEGACY_ROLE_MAP[role ?? ''] ?? 'colaborador';
}

export const ROLE_NAV: Record<UserRole, RoleNavConfig> = {
  dono_saas: [
    {
      items: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
        { to: '/companies', icon: Factory, label: 'Empresas' },
        { to: '/saas-requests', icon: Inbox, label: 'Solicitações' },
        { to: '/audit', icon: BookOpen, label: 'Auditoria' },
      ],
    },
    {
      title: 'Comercial',
      items: [
        { to: '/saas-plans', icon: CreditCard, label: 'Planos' },
        { to: '/saas-subscriptions', icon: FileSignature, label: 'Assinaturas' },
        { to: '/saas-invoices', icon: ReceiptText, label: 'Faturas' },
      ],
    },
    {
      title: 'Acesso',
      items: [
        { to: '/saas-users', icon: Users, label: 'Utilizadores' },
      ],
    },
    {
      title: 'Sistema',
      items: [
        { to: '/profile', icon: User, label: 'Perfil' },
      ],
    },
  ],

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

  rh: [
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

  chefe_departamento: [
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

  colaborador: [
    {
      items: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
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
  dono_saas: { bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500/20', dot: 'bg-violet-500' },
  admin: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20', dot: 'bg-blue-500' },
  rh: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
  supervisor: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20', dot: 'bg-amber-500' },
  chefe_departamento: { bg: 'bg-sky-500/10', text: 'text-sky-500', border: 'border-sky-500/20', dot: 'bg-sky-500' },
  colaborador: { bg: 'bg-zinc-500/10', text: 'text-zinc-500', border: 'border-zinc-500/20', dot: 'bg-zinc-500' },
};

export const ROLE_ROUTE_ACCESS: Record<UserRole, string[]> = Object.fromEntries(
  Object.entries(ROLE_NAV).map(([role, sections]) => [
    role,
    Array.from(new Set(sections.flatMap(section => section.items.map(item => item.to)))),
  ]),
) as Record<UserRole, string[]>;

export function canAccessPath(role: UserRole, pathname: string) {
  return ROLE_ROUTE_ACCESS[role]?.includes(pathname) ?? false;
}
