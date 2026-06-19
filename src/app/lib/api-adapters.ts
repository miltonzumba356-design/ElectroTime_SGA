// Maps API responses (Portuguese field names) to frontend types (English field names)
import type {
  Department, Employee, Post, Supervisor,
  Schedule, Timetable, Attendance, Request,
} from './types';

export function adaptDepartment(d: any): Department {
  return {
    id:             String(d.id ?? ''),
    name:           d.nome ?? d.name ?? '',
    code:           d.codigo ?? d.code ?? String(d.id ?? ''),
    company_id:     String(d.empresa ?? d.company_id ?? ''),
    manager_id:     d.responsavel_id ? String(d.responsavel_id) : undefined,
    manager_name:   d.responsavel ?? d.manager_name ?? undefined,
    employee_count: d.total_colaboradores ?? d.employee_count ?? 0,
    active:         d.ativo ?? d.active ?? true,
    created_at:     d.criado_em ?? d.created_at ?? new Date().toISOString(),
  };
}

export function adaptEmployee(e: any): Employee {
  return {
    id:              String(e.id ?? ''),
    registration:    e.matricula ?? e.registration ?? String(e.id ?? ''),
    name:            e.nome ?? e.name ?? '',
    email:           e.email ?? '',
    phone:           e.telefone ?? e.phone ?? '',
    cpf:             e.cpf ?? '',
    birth_date:      e.data_nascimento ?? e.birth_date ?? '',
    gender:          e.sexo ?? e.gender ?? 'M',
    hire_date:       e.data_admissao ?? e.hire_date ?? '',
    dismissal_date:  e.data_demissao ?? e.dismissal_date ?? undefined,
    status:          mapEmployeeStatus(e.status),
    contract_type:   mapContractType(e.tipo_contrato ?? e.contract_type ?? 'clt'),
    company_id:      String(e.empresa ?? e.company_id ?? ''),
    department_id:   String(e.departamento_id ?? e.department_id ?? ''),
    department_name: e.departamento ?? e.department_name ?? undefined,
    role_id:         String(e.cargo_id ?? e.role_id ?? ''),
    role_name:       e.cargo ?? e.role_name ?? undefined,
    post_id:         e.posto_id ? String(e.posto_id) : undefined,
    post_name:       e.posto ?? e.post_name ?? undefined,
    timetable_id:    e.turno_id ? String(e.turno_id) : undefined,
    timetable_name:  e.turno ?? e.timetable_name ?? undefined,
    supervisor_id:   e.supervisor_id ? String(e.supervisor_id) : undefined,
    supervisor_name: e.supervisor ?? e.supervisor_name ?? undefined,
    bank_hours_balance: e.banco_horas ?? e.bank_hours_balance ?? 0,
    overtime_hours:  e.horas_extras ?? e.overtime_hours ?? 0,
    created_at:      e.criado_em ?? e.created_at ?? new Date().toISOString(),
  };
}

function mapEmployeeStatus(s: string): Employee['status'] {
  const map: Record<string, Employee['status']> = {
    ativo: 'active', active: 'active',
    inativo: 'inactive', inactive: 'inactive',
    ferias: 'vacation', vacation: 'vacation',
    afastado: 'leave', leave: 'leave',
  };
  return map[s] ?? 'active';
}

function mapContractType(s: string): Employee['contract_type'] {
  const map: Record<string, Employee['contract_type']> = {
    efetivo: 'clt', clt: 'clt',
    temporario: 'temp', temp: 'temp',
    estagio: 'intern', intern: 'intern',
    prestador: 'pj', pj: 'pj',
  };
  return map[s] ?? 'clt';
}

export function adaptPost(p: any): Post {
  return {
    id:             String(p.id ?? ''),
    name:           p.nome ?? p.name ?? '',
    code:           p.codigo ?? p.code ?? String(p.id ?? ''),
    company_id:     String(p.empresa ?? p.company_id ?? ''),
    location:       [p.endereco, p.cidade, p.estado].filter(Boolean).join(', ') || p.location || '',
    description:    p.descricao ?? p.description ?? undefined,
    employee_count: p.total_colaboradores ?? p.employee_count ?? 0,
    active:         p.ativo ?? p.active ?? true,
    created_at:     p.criado_em ?? p.created_at ?? new Date().toISOString(),
  };
}

export function adaptSupervisor(s: any): Supervisor {
  return {
    id:             String(s.id ?? ''),
    name:           s.nome ?? s.name ?? '',
    email:          s.email ?? '',
    phone:          s.telefone ?? s.phone ?? '',
    cpf:            s.cpf ?? '',
    company_id:     String(s.empresa ?? s.company_id ?? ''),
    department_id:  String(s.departamento_id ?? s.department_id ?? ''),
    department_name: s.departamento ?? s.department_name ?? undefined,
    role_name:      s.cargo ?? s.role_name ?? undefined,
    employee_count: s.total_colaboradores ?? s.employee_count ?? 0,
    active:         s.ativo ?? s.active ?? true,
    created_at:     s.criado_em ?? s.created_at ?? new Date().toISOString(),
  };
}

export function adaptSchedule(s: any): Schedule {
  return {
    id:              String(s.id ?? ''),
    name:            s.nome ?? s.name ?? '',
    company_id:      String(s.empresa ?? s.company_id ?? ''),
    type:            s.regime_trabalho ?? s.type ?? 'custom',
    days_of_week:    s.dias_semana ?? s.days_of_week ?? [],
    active:          s.ativo ?? s.active ?? true,
    timetable_count: s.total_turnos ?? s.timetable_count ?? 0,
    employee_count:  s.total_colaboradores ?? s.employee_count ?? 0,
    created_at:      s.criado_em ?? s.created_at ?? new Date().toISOString(),
  };
}

export function adaptTimetable(t: any): Timetable {
  return {
    id:              String(t.id ?? ''),
    name:            t.nome ?? t.name ?? '',
    company_id:      String(t.empresa ?? t.company_id ?? ''),
    schedule_id:     String(t.escala_id ?? t.schedule_id ?? ''),
    schedule_name:   t.escala ?? t.schedule_name ?? undefined,
    entry_time:      t.horario_entrada ?? t.entry_time ?? '',
    exit_time:       t.horario_saida ?? t.exit_time ?? '',
    break_start:     t.horario_almoco_inicio ?? t.break_start ?? undefined,
    break_end:       t.horario_almoco_fim ?? t.break_end ?? undefined,
    total_hours:     t.carga_horaria ?? t.total_hours ?? 0,
    tolerance_entry: t.tolerancia_entrada ?? t.tolerance_entry ?? 0,
    tolerance_exit:  t.tolerancia_saida ?? t.tolerance_exit ?? 0,
    active:          t.ativo ?? t.active ?? true,
    created_at:      t.criado_em ?? t.created_at ?? new Date().toISOString(),
  };
}

export function normalizeList<T>(raw: any, adapter: (item: any) => T): T[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : raw.results ?? raw.data ?? raw.colaboradores ?? raw.departamentos ?? raw.postos ?? [];
  return arr.map(adapter);
}
