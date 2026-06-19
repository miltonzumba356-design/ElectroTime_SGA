/**
 * TDD + SDD — Schema contract tests
 * These tests verify that the Zod schemas correctly enforce the OpenAPI contract.
 * A failing test means the backend contract was violated or the schema is wrong.
 */
import { describe, it, expect } from 'vitest';
import {
  LoginResponseSchema,
  DepartmentSchema,
  DepartmentListSchema,
  EmployeeSchema,
  TurnoSchema,
  SupervisorSchema,
  VacationSchema,
  ContractSchema,
  HolidaySchema,
  DeclarationSchema,
  AuditLogSchema,
  AbsenceReportSchema,
  CompanySchema,
  paginatedSchema,
  safeValidate,
} from '../api-schemas';

// ── LoginResponse ─────────────────────────────────────────────────

describe('LoginResponseSchema', () => {
  const valid = {
    access: 'eyJhbGciOiJIUzI1NiJ9.abc',
    refresh: 'eyJhbGciOiJIUzI1NiJ9.def',
    tipo_role: 'admin',
    nome: 'Ricardo',
    email: 'admin@test.com',
  };

  it('accepts a valid login response', () => {
    expect(LoginResponseSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts response without optional fields', () => {
    const minimal = { access: 'a', refresh: 'b', tipo_role: 'rh' };
    expect(LoginResponseSchema.safeParse(minimal).success).toBe(true);
  });

  it('rejects missing access token', () => {
    const bad = { ...valid, access: undefined };
    expect(LoginResponseSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects empty access string', () => {
    expect(LoginResponseSchema.safeParse({ ...valid, access: '' }).success).toBe(false);
  });
});

// ── Department ────────────────────────────────────────────────────

describe('DepartmentSchema', () => {
  const valid = {
    id: 1,
    nome: 'Desenvolvimento',
    descricao: 'Equipe dev',
    responsavel: 'Maria',
    total_colaboradores: 8,
  };

  it('accepts a valid department', () => {
    expect(DepartmentSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts department without optional fields', () => {
    expect(DepartmentSchema.safeParse({ id: 2, nome: 'TI' }).success).toBe(true);
  });

  it('accepts null descricao', () => {
    expect(DepartmentSchema.safeParse({ ...valid, descricao: null }).success).toBe(true);
  });

  it('rejects missing id', () => {
    expect(DepartmentSchema.safeParse({ nome: 'TI' }).success).toBe(false);
  });

  it('rejects empty nome', () => {
    expect(DepartmentSchema.safeParse({ id: 1, nome: '' }).success).toBe(false);
  });

  it('validates an array of departments', () => {
    const list = [valid, { id: 2, nome: 'Comercial' }];
    expect(DepartmentListSchema.safeParse(list).success).toBe(true);
  });
});

// ── Employee ─────────────────────────────────────────────────────

describe('EmployeeSchema', () => {
  const valid = {
    id: 1,
    nome: 'João Silva',
    email: 'joao@test.com',
    cpf: '123.456.789-00',
    matricula: 'ET-0001',
    status: 'ativo',
    tipo_contrato: 'clt',
  };

  it('accepts a valid employee', () => {
    expect(EmployeeSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts employee with minimal fields', () => {
    expect(EmployeeSchema.safeParse({ id: 1, nome: 'Teste' }).success).toBe(true);
  });

  it('accepts null nullable fields', () => {
    expect(EmployeeSchema.safeParse({ ...valid, cpf: null, email: null }).success).toBe(true);
  });

  it('rejects invalid email format', () => {
    const result = EmployeeSchema.safeParse({ ...valid, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects missing id', () => {
    expect(EmployeeSchema.safeParse({ nome: 'X' }).success).toBe(false);
  });
});

// ── Turno (Timetable) ─────────────────────────────────────────────

describe('TurnoSchema', () => {
  const valid = {
    id: 1,
    nome: 'Matutino',
    horario_entrada: '06:00:00',
    horario_saida: '14:00:00',
    horario_almoco_inicio: '10:00:00',
    horario_almoco_fim: '11:00:00',
    ativo: true,
  };

  it('accepts a valid turno', () => {
    expect(TurnoSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid horario_entrada format', () => {
    const bad = { ...valid, horario_entrada: 'not-a-time' };
    expect(TurnoSchema.safeParse(bad).success).toBe(false);
  });

  it('accepts turno with partial time fields', () => {
    const partial = { id: 1, nome: 'Noturno', horario_entrada: '22:00', horario_saida: '06:00' };
    expect(TurnoSchema.safeParse(partial).success).toBe(true);
  });
});

// ── Supervisor ────────────────────────────────────────────────────

describe('SupervisorSchema', () => {
  const valid = {
    id: 2,
    nome: 'Maria Santos',
    email: 'maria@test.com',
    departamento: 'Desenvolvimento',
    total_colaboradores: 8,
    status: 'ativo',
  };

  it('accepts a valid supervisor', () => {
    expect(SupervisorSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(SupervisorSchema.safeParse({ ...valid, email: 'bad' }).success).toBe(false);
  });
});

// ── Vacation ─────────────────────────────────────────────────────

describe('VacationSchema', () => {
  const valid = {
    id: 1,
    colaborador_id: 1,
    colaborador_nome: 'João Silva',
    data_inicio: '2026-07-01',
    data_fim: '2026-07-15',
    dias: 15,
    status: 'aprovado',
    criado_em: '2026-06-01T10:00:00Z',
  };

  it('accepts a valid vacation', () => {
    expect(VacationSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid date format', () => {
    expect(VacationSchema.safeParse({ ...valid, data_inicio: '01/07/2026' }).success).toBe(false);
  });

  it('accepts vacation without end date (single-day absence)', () => {
    const { data_fim, ...noEnd } = valid;
    expect(VacationSchema.safeParse(noEnd).success).toBe(true);
  });
});

// ── Contract ─────────────────────────────────────────────────────

describe('ContractSchema', () => {
  const valid = {
    id: 1,
    colaborador_id: 1,
    colaborador_nome: 'João Silva',
    tipo_contrato: 'clt',
    status: 'ativo',
    salario_base: '5000.00',
    data_inicio: '2024-01-01',
  };

  it('accepts a valid contract', () => {
    expect(ContractSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts salario_base as number', () => {
    expect(ContractSchema.safeParse({ ...valid, salario_base: 5000 }).success).toBe(true);
  });

  it('rejects missing tipo_contrato', () => {
    const { tipo_contrato, ...bad } = valid;
    expect(ContractSchema.safeParse(bad).success).toBe(false);
  });
});

// ── Holiday ──────────────────────────────────────────────────────

describe('HolidaySchema', () => {
  const valid = {
    id: 1,
    nome: 'Natal',
    data: '2026-12-25',
    tipo: 'nacional',
    recorrente: true,
  };

  it('accepts a valid holiday', () => {
    expect(HolidaySchema.safeParse(valid).success).toBe(true);
  });

  it('accepts holiday without optional fields', () => {
    expect(HolidaySchema.safeParse({ id: 2, nome: 'Feriado', data: '2026-05-01', tipo: 'nacional' }).success).toBe(true);
  });

  it('rejects missing data field', () => {
    const { data, ...bad } = valid;
    expect(HolidaySchema.safeParse(bad).success).toBe(false);
  });
});

// ── Declaration ──────────────────────────────────────────────────

describe('DeclarationSchema', () => {
  const valid = {
    id: 1,
    colaborador_id: 1,
    colaborador_nome: 'João Silva',
    tipo: 'employment',
    assunto: 'Declaração de Vínculo',
    conteudo: 'Declaramos que...',
    status: 'enviada',
    criado_em: '2026-06-01T10:00:00Z',
  };

  it('accepts a valid declaration', () => {
    expect(DeclarationSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects missing conteudo', () => {
    const { conteudo, ...bad } = valid;
    expect(DeclarationSchema.safeParse(bad).success).toBe(false);
  });
});

// ── AuditLog ─────────────────────────────────────────────────────

describe('AuditLogSchema', () => {
  const valid = {
    id: 1,
    acao: 'login',
    descricao: 'Login bem-sucedido',
    usuario: 'admin',
    criado_em: '2026-06-19T10:00:00Z',
  };

  it('accepts a valid audit log', () => {
    expect(AuditLogSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects missing criado_em', () => {
    const { criado_em, ...bad } = valid;
    expect(AuditLogSchema.safeParse(bad).success).toBe(false);
  });
});

// ── AbsenceReport ────────────────────────────────────────────────

describe('AbsenceReportSchema', () => {
  const valid = [
    { colaborador_nome: 'Pedro Lima', departamento: 'Logística', total_faltas: 2, dias: ['2026-06-03', '2026-06-10'] },
    { colaborador_nome: 'Ana Costa', total_faltas: 0 },
  ];

  it('accepts a valid absence report array', () => {
    expect(AbsenceReportSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts item without dias field', () => {
    expect(AbsenceReportSchema.safeParse([{ colaborador_nome: 'X', total_faltas: 1 }]).success).toBe(true);
  });

  it('rejects item with missing colaborador_nome', () => {
    expect(AbsenceReportSchema.safeParse([{ total_faltas: 1 }]).success).toBe(false);
  });
});

// ── paginatedSchema ───────────────────────────────────────────────

describe('paginatedSchema', () => {
  const PaginatedDept = paginatedSchema(DepartmentSchema);

  it('validates a paginated response', () => {
    const valid = {
      count: 1,
      next: null,
      previous: null,
      results: [{ id: 1, nome: 'TI' }],
    };
    expect(PaginatedDept.safeParse(valid).success).toBe(true);
  });

  it('rejects missing results array', () => {
    expect(PaginatedDept.safeParse({ count: 0, next: null, previous: null }).success).toBe(false);
  });

  it('validates results items against the item schema', () => {
    const withBadItem = {
      count: 1, next: null, previous: null,
      results: [{ id: 'not-a-number', nome: 'Bad' }],
    };
    expect(PaginatedDept.safeParse(withBadItem).success).toBe(false);
  });
});

// ── safeValidate helper ───────────────────────────────────────────

describe('safeValidate', () => {
  it('returns validated data when schema passes', () => {
    const data = { id: 1, nome: 'TI' };
    const result = safeValidate(DepartmentSchema, data, 'Department');
    expect(result).toEqual(data);
  });

  it('returns raw data unchanged when schema fails (warns only)', () => {
    const bad = { nome: 'TI' };
    const result = safeValidate(DepartmentSchema, bad, 'Department');
    expect(result).toEqual(bad);
  });
});

// ── Company ──────────────────────────────────────────────────────

describe('CompanySchema', () => {
  const valid = {
    id: 1,
    nome: 'Tech Solutions LTDA',
    email: 'contato@tech.com',
    ativo: true,
    total_colaboradores: 25,
  };

  it('accepts a valid company', () => {
    expect(CompanySchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(CompanySchema.safeParse({ ...valid, email: 'bad' }).success).toBe(false);
  });

  it('accepts company with null nullable fields', () => {
    expect(CompanySchema.safeParse({ ...valid, nif: null, telefone: null }).success).toBe(true);
  });
});
