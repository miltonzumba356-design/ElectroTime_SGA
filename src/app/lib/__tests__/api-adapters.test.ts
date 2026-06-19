import { describe, it, expect } from 'vitest';
import {
  adaptDepartment,
  adaptEmployee,
  adaptPost,
  adaptSupervisor,
  adaptSchedule,
  adaptTimetable,
  normalizeList,
} from '../api-adapters';

// ── normalizeList ─────────────────────────────────────────────────

describe('normalizeList', () => {
  const identity = (x: any) => x;

  it('returns [] for undefined input', () => {
    expect(normalizeList(undefined, identity)).toEqual([]);
  });

  it('returns [] for null input', () => {
    expect(normalizeList(null, identity)).toEqual([]);
  });

  it('maps a plain array', () => {
    expect(normalizeList([1, 2, 3], (x: number) => x * 2)).toEqual([2, 4, 6]);
  });

  it('extracts paginated .results', () => {
    const paginated = { count: 1, next: null, previous: null, results: [{ id: 1 }] };
    expect(normalizeList(paginated, identity)).toEqual([{ id: 1 }]);
  });

  it('extracts .data array', () => {
    expect(normalizeList({ data: [42] }, identity)).toEqual([42]);
  });

  it('extracts .colaboradores array', () => {
    expect(normalizeList({ colaboradores: ['a', 'b'] }, identity)).toEqual(['a', 'b']);
  });

  it('returns [] for object with no known list key', () => {
    expect(normalizeList({ unknown: [1, 2] }, identity)).toEqual([]);
  });
});

// ── adaptDepartment ───────────────────────────────────────────────

describe('adaptDepartment', () => {
  const raw = {
    id: 1,
    nome: 'Desenvolvimento',
    descricao: 'Equipe dev',
    responsavel: 'Maria',
    total_colaboradores: 8,
    ativo: true,
    criado_em: '2026-01-01T00:00:00Z',
  };

  it('maps Portuguese fields to English', () => {
    const dept = adaptDepartment(raw);
    expect(dept.id).toBe('1');
    expect(dept.name).toBe('Desenvolvimento');
    expect(dept.manager_name).toBe('Maria');
    expect(dept.employee_count).toBe(8);
    expect(dept.active).toBe(true);
  });

  it('falls back to empty string when nome is missing', () => {
    expect(adaptDepartment({ id: 2 }).name).toBe('');
  });

  it('uses active=true as default when ativo is absent', () => {
    expect(adaptDepartment({ id: 3, nome: 'X' }).active).toBe(true);
  });

  it('converts numeric id to string', () => {
    expect(typeof adaptDepartment({ id: 99, nome: 'Y' }).id).toBe('string');
  });
});

// ── adaptEmployee ─────────────────────────────────────────────────

describe('adaptEmployee', () => {
  const raw = {
    id: 1,
    nome: 'João Silva',
    email: 'joao@test.com',
    cpf: '123.456.789-00',
    matricula: 'ET-0001',
    cargo: 'Engenheiro',
    cargo_id: 3,
    departamento: 'Desenvolvimento',
    departamento_id: 1,
    turno: 'Matutino',
    turno_id: 1,
    status: 'ativo',
    tipo_contrato: 'clt',
    data_admissao: '2024-01-01',
  };

  it('maps nome → name', () => {
    expect(adaptEmployee(raw).name).toBe('João Silva');
  });

  it('maps status: ativo → active', () => {
    expect(adaptEmployee(raw).status).toBe('active');
  });

  it('maps status: ferias → vacation', () => {
    expect(adaptEmployee({ ...raw, status: 'ferias' }).status).toBe('vacation');
  });

  it('maps status: inativo → inactive', () => {
    expect(adaptEmployee({ ...raw, status: 'inativo' }).status).toBe('inactive');
  });

  it('maps tipo_contrato: clt → clt', () => {
    expect(adaptEmployee(raw).contract_type).toBe('clt');
  });

  it('maps tipo_contrato: estagio → intern', () => {
    expect(adaptEmployee({ ...raw, tipo_contrato: 'estagio' }).contract_type).toBe('intern');
  });

  it('maps departamento_id as string', () => {
    expect(adaptEmployee(raw).department_id).toBe('1');
  });

  it('maps cargo → role_name', () => {
    expect(adaptEmployee(raw).role_name).toBe('Engenheiro');
  });

  it('defaults unknown status to active', () => {
    expect(adaptEmployee({ ...raw, status: 'xyz' }).status).toBe('active');
  });
});

// ── adaptPost ────────────────────────────────────────────────────

describe('adaptPost', () => {
  const raw = {
    id: 1,
    nome: 'Sede',
    endereco: 'Av. Paulista',
    cidade: 'São Paulo',
    estado: 'SP',
    ativo: true,
    total_colaboradores: 50,
  };

  it('maps nome → name', () => {
    expect(adaptPost(raw).name).toBe('Sede');
  });

  it('concatenates address parts into location', () => {
    expect(adaptPost(raw).location).toBe('Av. Paulista, São Paulo, SP');
  });

  it('maps total_colaboradores → employee_count', () => {
    expect(adaptPost(raw).employee_count).toBe(50);
  });
});

// ── adaptSupervisor ───────────────────────────────────────────────

describe('adaptSupervisor', () => {
  const raw = {
    id: 2,
    nome: 'Maria Santos',
    email: 'maria@test.com',
    departamento: 'Desenvolvimento',
    departamento_id: 1,
    total_colaboradores: 8,
    ativo: true,
  };

  it('maps nome → name', () => {
    expect(adaptSupervisor(raw).name).toBe('Maria Santos');
  });

  it('maps departamento → department_name', () => {
    expect(adaptSupervisor(raw).department_name).toBe('Desenvolvimento');
  });

  it('maps ativo → active', () => {
    expect(adaptSupervisor(raw).active).toBe(true);
  });
});

// ── adaptSchedule ────────────────────────────────────────────────

describe('adaptSchedule', () => {
  const raw = {
    id: 1,
    nome: 'Escala Semanal',
    regime_trabalho: '5x2',
    dias_semana: [1, 2, 3, 4, 5],
    ativo: true,
    criado_em: '2026-01-01T00:00:00Z',
  };

  it('maps nome → name', () => {
    expect(adaptSchedule(raw).name).toBe('Escala Semanal');
  });

  it('maps regime_trabalho → type', () => {
    expect(adaptSchedule(raw).type).toBe('5x2');
  });

  it('maps dias_semana → days_of_week', () => {
    expect(adaptSchedule(raw).days_of_week).toEqual([1, 2, 3, 4, 5]);
  });
});

// ── adaptTimetable ────────────────────────────────────────────────

describe('adaptTimetable', () => {
  const raw = {
    id: 1,
    nome: 'Matutino',
    horario_entrada: '06:00:00',
    horario_saida: '14:00:00',
    horario_almoco_inicio: '10:00:00',
    horario_almoco_fim: '11:00:00',
    tolerancia_entrada: 10,
    tolerancia_saida: 5,
    carga_horaria: 8,
    ativo: true,
  };

  it('maps horario_entrada → entry_time', () => {
    expect(adaptTimetable(raw).entry_time).toBe('06:00:00');
  });

  it('maps horario_saida → exit_time', () => {
    expect(adaptTimetable(raw).exit_time).toBe('14:00:00');
  });

  it('maps carga_horaria → total_hours', () => {
    expect(adaptTimetable(raw).total_hours).toBe(8);
  });

  it('maps tolerancia_entrada → tolerance_entry', () => {
    expect(adaptTimetable(raw).tolerance_entry).toBe(10);
  });
});
