/**
 * SDD — Swagger-Driven Development
 * Zod schemas derived from the OpenAPI contract at:
 * https://eletro-time-production.up.railway.app/api/swagger/
 *
 * Every schema mirrors a response shape in api_backend.yaml.
 * Used at runtime to validate API responses and catch contract drift early.
 */
import { z } from 'zod';

// ── Primitives ────────────────────────────────────────────────────

const DateString = z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Expected YYYY-MM-DD');
const TimeString = z.string().regex(/^\d{2}:\d{2}/, 'Expected HH:MM');
const ISODateTime = z.string().datetime({ offset: true }).or(z.string().min(1));

// ── Pagination wrapper ────────────────────────────────────────────

export function paginatedSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    count: z.number().int(),
    next: z.string().url().nullable(),
    previous: z.string().url().nullable(),
    results: z.array(itemSchema),
  });
}

// ── Auth ─────────────────────────────────────────────────────────

export const LoginResponseSchema = z.object({
  access: z.string().min(1),
  refresh: z.string().min(1),
  tipo_role: z.string().min(1),
  nome: z.string().optional(),
  email: z.string().email().optional(),
  empresa_id: z.number().optional(),
  empresa_nome: z.string().optional(),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const RefreshResponseSchema = z.object({
  access: z.string().min(1),
});

// ── Department ───────────────────────────────────────────────────

export const DepartmentSchema = z.object({
  id: z.number().int(),
  nome: z.string().min(1),
  descricao: z.string().optional().nullable(),
  responsavel: z.string().optional().nullable(),
  total_colaboradores: z.number().int().optional(),
});
export type DepartmentAPI = z.infer<typeof DepartmentSchema>;
export const DepartmentListSchema = z.array(DepartmentSchema);

// ── Post (Posto) ─────────────────────────────────────────────────

export const PostSchema = z.object({
  id: z.number().int(),
  nome: z.string().min(1),
  endereco: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  raio_geofencing: z.number().optional().nullable(),
  tensao: z.string().optional().nullable(),
  ativo: z.boolean(),
});
export type PostAPI = z.infer<typeof PostSchema>;
export const PostListSchema = z.array(PostSchema);

// ── Timetable (Turno) ────────────────────────────────────────────

export const TurnoSchema = z.object({
  id: z.number().int(),
  nome: z.string().min(1),
  descricao: z.string().optional().nullable(),
  horario_entrada: TimeString,
  horario_saida: TimeString,
  horario_almoco_inicio: TimeString.optional().nullable(),
  horario_almoco_fim: TimeString.optional().nullable(),
  tolerancia_entrada: z.number().optional().nullable(),
  tolerancia_saida: z.number().optional().nullable(),
  carga_horaria: z.number().optional().nullable(),
  ativo: z.boolean().optional(),
  total_colaboradores: z.number().int().optional(),
});
export type TurnoAPI = z.infer<typeof TurnoSchema>;
export const TurnoListSchema = z.array(TurnoSchema);

// ── Supervisor ───────────────────────────────────────────────────

export const SupervisorSchema = z.object({
  id: z.number().int(),
  nome: z.string().min(1),
  email: z.string().email(),
  departamento: z.string().optional().nullable(),
  departamento_id: z.number().int().optional().nullable(),
  total_colaboradores: z.number().int().optional(),
  status: z.string().optional(),
  ativo: z.boolean().optional(),
  criado_em: ISODateTime.optional(),
  ultimo_acesso: ISODateTime.optional().nullable(),
});
export type SupervisorAPI = z.infer<typeof SupervisorSchema>;
export const SupervisorListSchema = z.array(SupervisorSchema);

// ── Employee (Colaborador) ────────────────────────────────────────

export const EmployeeSchema = z.object({
  id: z.number().int(),
  nome: z.string().min(1),
  email: z.string().email().optional().nullable(),
  cpf: z.string().optional().nullable(),
  matricula: z.string().optional().nullable(),
  telefone: z.string().optional().nullable(),
  data_nascimento: DateString.optional().nullable(),
  genero: z.string().optional().nullable(),
  data_admissao: DateString.optional().nullable(),
  tipo_contrato: z.string().optional().nullable(),
  cargo: z.string().optional().nullable(),
  cargo_id: z.number().int().optional().nullable(),
  departamento: z.string().optional().nullable(),
  departamento_id: z.number().int().optional().nullable(),
  turno: z.string().optional().nullable(),
  turno_id: z.number().int().optional().nullable(),
  status: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
  criado_em: ISODateTime.optional(),
});
export type EmployeeAPI = z.infer<typeof EmployeeSchema>;
export const EmployeeListSchema = z.array(EmployeeSchema);

// ── Role (Cargo) ─────────────────────────────────────────────────

export const RoleSchema = z.object({
  id: z.number().int(),
  nome: z.string().min(1),
  descricao: z.string().optional().nullable(),
  nivel: z.number().int().optional().nullable(),
  ativo: z.boolean().optional(),
});
export type RoleAPI = z.infer<typeof RoleSchema>;
export const PaginatedRoleSchema = paginatedSchema(RoleSchema);

// ── Schedule (Escala) ────────────────────────────────────────────

export const ScheduleSchema = z.object({
  id: z.number().int(),
  nome: z.string().min(1),
  regime_trabalho: z.string().optional().nullable(),
  dias_semana: z.array(z.number()).optional().nullable(),
  ativo: z.boolean().optional(),
  criado_em: ISODateTime.optional(),
});
export type ScheduleAPI = z.infer<typeof ScheduleSchema>;

// ── Vacation (Férias) ────────────────────────────────────────────

export const VacationSchema = z.object({
  id: z.number().int(),
  colaborador_id: z.number().int().optional().nullable(),
  colaborador_nome: z.string().optional().nullable(),
  matricula: z.string().optional().nullable(),
  departamento: z.string().optional().nullable(),
  tipo: z.string().optional().nullable(),
  data_inicio: DateString,
  data_fim: DateString.optional().nullable(),
  dias: z.number().int().optional().nullable(),
  motivo: z.string().optional().nullable(),
  justificativa: z.string().optional().nullable(),
  status: z.string(),
  erp_exportado: z.boolean().optional(),
  criado_por: z.string().optional().nullable(),
  criado_em: ISODateTime.optional(),
});
export type VacationAPI = z.infer<typeof VacationSchema>;
export const VacationListSchema = z.array(VacationSchema).or(paginatedSchema(VacationSchema));

// ── Contract ─────────────────────────────────────────────────────

export const ContractSchema = z.object({
  id: z.number().int(),
  colaborador_id: z.number().int().optional().nullable(),
  colaborador_nome: z.string().optional().nullable(),
  tipo_contrato: z.string(),
  status: z.string(),
  salario_base: z.string().or(z.number()),
  data_inicio: DateString,
  data_fim: DateString.optional().nullable(),
  beneficios: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  criado_em: ISODateTime.optional(),
});
export type ContractAPI = z.infer<typeof ContractSchema>;
export const ContractListSchema = z.array(ContractSchema).or(paginatedSchema(ContractSchema));

// ── Holiday (Feriado) ────────────────────────────────────────────

export const HolidaySchema = z.object({
  id: z.number().int(),
  nome: z.string().min(1),
  data: DateString,
  tipo: z.string(),
  descricao: z.string().optional().nullable(),
  recorrente: z.boolean().optional(),
  empresa: z.number().int().optional().nullable(),
  criado_em: ISODateTime.optional(),
});
export type HolidayAPI = z.infer<typeof HolidaySchema>;
export const HolidayListSchema = z.array(HolidaySchema).or(paginatedSchema(HolidaySchema));

// ── Declaration ──────────────────────────────────────────────────

export const DeclarationSchema = z.object({
  id: z.number().int(),
  empresa: z.number().int().optional().nullable(),
  colaborador_id: z.number().int().optional().nullable(),
  colaborador: z.number().int().optional().nullable(),
  colaborador_nome: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  matricula: z.string().optional().nullable(),
  departamento: z.string().optional().nullable(),
  tipo: z.string(),
  assunto: z.string(),
  conteudo: z.string(),
  status: z.string(),
  enviado_em: ISODateTime.optional().nullable(),
  entregue_em: ISODateTime.optional().nullable(),
  criado_por: z.string().optional().nullable(),
  criado_em: ISODateTime.optional(),
});
export type DeclarationAPI = z.infer<typeof DeclarationSchema>;
export const DeclarationListSchema = z.array(DeclarationSchema).or(paginatedSchema(DeclarationSchema));

// ── Presence Auth ────────────────────────────────────────────────

export const PresenceAuthSchema = z.object({
  id: z.number().int(),
  colaborador_nome: z.string().optional().nullable(),
  hora_entrada: z.string().optional().nullable(),
  hora_saida: z.string().optional().nullable(),
  distancia_metros: z.number().optional().nullable(),
  justificativa: z.string().optional().nullable(),
  status: z.string(),
  criado_em: ISODateTime.optional(),
});
export type PresenceAuthAPI = z.infer<typeof PresenceAuthSchema>;
export const PresenceAuthListSchema = z.array(PresenceAuthSchema).or(paginatedSchema(PresenceAuthSchema));

// ── Absence Report ───────────────────────────────────────────────

export const AbsenceReportItemSchema = z.object({
  colaborador_nome: z.string(),
  departamento: z.string().optional().nullable(),
  total_faltas: z.number().int(),
  dias: z.array(DateString).optional().nullable(),
});
export const AbsenceReportSchema = z.array(AbsenceReportItemSchema);

// ── Audit Log ────────────────────────────────────────────────────

export const AuditLogSchema = z.object({
  id: z.number().int(),
  acao: z.string(),
  descricao: z.string().optional().nullable(),
  detalhe: z.string().optional().nullable(),
  usuario: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  empresa: z.string().optional().nullable(),
  ip: z.string().optional().nullable(),
  status: z.string().optional(),
  criado_em: ISODateTime,
});
export type AuditLogAPI = z.infer<typeof AuditLogSchema>;
export const PaginatedAuditLogSchema = paginatedSchema(AuditLogSchema);

// ── Company ──────────────────────────────────────────────────────

export const CompanySchema = z.object({
  id: z.number().int(),
  nome: z.string().min(1),
  nome_fantasia: z.string().optional().nullable(),
  nif: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  telefone: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  plano: z.string().optional(),
  total_colaboradores: z.number().int().optional(),
  ativo: z.boolean().optional(),
  criado_em: ISODateTime.optional(),
});
export type CompanyAPI = z.infer<typeof CompanySchema>;
export const PaginatedCompanySchema = paginatedSchema(CompanySchema);

// ── Payroll ──────────────────────────────────────────────────────

export const PayrollItemSchema = z.object({
  colaborador_id: z.number().int().optional(),
  colaborador_nome: z.string().optional(),
  salario_base: z.number().or(z.string()),
  descontos: z.number().or(z.string()).optional(),
  bonus: z.number().or(z.string()).optional(),
  liquido: z.number().or(z.string()).optional(),
});
export const PayrollSchema = z.object({
  id: z.number().int().optional(),
  mes: z.number().int().optional(),
  ano: z.number().int().optional(),
  status: z.string().optional(),
  total_gross: z.number().or(z.string()).optional(),
  total_net: z.number().or(z.string()).optional(),
  total_employees: z.number().int().optional(),
  erp_exported: z.boolean().optional(),
  itens: z.array(PayrollItemSchema).optional(),
  items: z.array(PayrollItemSchema).optional(),
  criado_em: ISODateTime.optional(),
});
export type PayrollAPI = z.infer<typeof PayrollSchema>;

// ── SaaS Request (Solicitação admin-saas) ────────────────────────

export const SaasRequestSchema = z.object({
  id: z.number().int(),
  nome_empresa: z.string().optional().nullable(),
  nif: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  telefone: z.string().optional().nullable(),
  plano: z.string().optional().nullable(),
  status: z.string(),
  motivo_rejeicao: z.string().optional().nullable(),
  aprovado_em: ISODateTime.optional().nullable(),
  criado_em: ISODateTime.optional(),
});
export type SaasRequestAPI = z.infer<typeof SaasRequestSchema>;
export const PaginatedSaasRequestSchema = paginatedSchema(SaasRequestSchema);

// ── Safe validator helper ─────────────────────────────────────────

export function safeValidate<T>(
  schema: z.ZodType<T>,
  data: unknown,
  label: string,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    if (import.meta.env.DEV) {
      console.warn(`[SDD] Schema mismatch for "${label}":`, result.error.flatten());
    }
    return data as T;
  }
  return result.data;
}
