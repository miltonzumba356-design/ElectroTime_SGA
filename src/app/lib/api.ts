import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ─── Axios instance ───────────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Inject access token on every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const raw = localStorage.getItem('electro-time');
  if (raw) {
    try {
      const state = JSON.parse(raw);
      const token = state?.state?.token;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // ignore parse errors
    }
  }
  return config;
});

// Handle 401 → try refresh → retry once
let refreshing = false;
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

api.interceptors.response.use(
  res => res,
  async error => {
    const original: AxiosRequestConfig & { _retry?: boolean } = error.config;
    if (error.response?.status !== 401 || original._retry) return Promise.reject(error);

    if (refreshing) {
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: (token) => {
            original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
            resolve(api(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    refreshing = true;

    try {
      const raw = localStorage.getItem('electro-time');
      const state = raw ? JSON.parse(raw) : null;
      const refresh = state?.state?.refreshToken;
      if (!refresh) throw new Error('no refresh token');

      const { data } = await axios.post(`${BASE_URL}/api/auth/refresh/`, { refresh });
      const newToken: string = data.access;

      // Persist new access token into zustand persisted state
      const stored = JSON.parse(localStorage.getItem('electro-time') ?? '{}');
      stored.state.token = newToken;
      localStorage.setItem('electro-time', JSON.stringify(stored));

      queue.forEach(q => q.resolve(newToken));
      queue = [];
      original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
      return api(original);
    } catch (e) {
      queue.forEach(q => q.reject(e));
      queue = [];
      // Clear auth state so user is redirected to login
      const stored = JSON.parse(localStorage.getItem('electro-time') ?? '{}');
      if (stored.state) {
        stored.state.token = null;
        stored.state.refreshToken = null;
        stored.state.isAuthenticated = false;
        stored.state.user = null;
        localStorage.setItem('electro-time', JSON.stringify(stored));
      }
      window.location.hash = '/login';
      return Promise.reject(e);
    } finally {
      refreshing = false;
    }
  },
);

// ─── Types ────────────────────────────────────────────────────────
export interface LoginResponse {
  access: string;
  refresh: string;
  id: number;
  username: string;
  email: string;
  nome: string;
  sobrenome: string;
  role: {
    tipo_role: string;
    tipo_role_display: string;
    empresa_id: number;
    empresa_nome: string;
  };
  autenticado: boolean;
  mensagem: string;
}

export interface ProfileResponse {
  id: number;
  username: string;
  email: string;
  nome: string;
  sobrenome: string;
  role: {
    tipo_role: string;
    tipo_role_display: string;
    empresa_id: number;
    empresa_nome: string;
  };
  autenticado: boolean;
}

type ResourceId = string | number;

export type ApiRole =
  | 'dono_saas'
  | 'admin'
  | 'rh'
  | 'supervisor'
  | 'chefe_departamento'
  | 'colaborador';

export const ROLE_ENDPOINTS: Record<ApiRole, string[]> = {
  dono_saas: [
    '/api/admin-saas/dashboard/',
    '/api/admin-saas/planos/',
    '/api/admin-saas/planos/{id}/',
    '/api/admin-saas/assinaturas/',
    '/api/admin-saas/assinaturas/{id}/',
    '/api/admin-saas/assinaturas/{id}/cancelar/',
    '/api/admin-saas/assinaturas/{id}/gerar_fatura/',
    '/api/admin-saas/assinaturas/{id}/reativar/',
    '/api/admin-saas/assinaturas/{id}/suspender/',
    '/api/admin-saas/faturas/',
    '/api/admin-saas/faturas/{id}/',
    '/api/admin-saas/faturas/{id}/marcar_paga/',
    '/api/admin-saas/usuarios/',
    '/api/admin-saas/usuarios/{id}/',
    '/api/admin-saas/usuarios/{id}/redefinir_senha/',
    '/api/admin-saas/solicitacoes/',
    '/api/admin-saas/solicitacoes/{id}/',
    '/api/admin-saas/solicitacoes/aprovar/',
    '/api/admin-saas/solicitacoes/rejeitar/',
    '/api/admin-saas/solicitacoes/pendentes/',
    '/api/admin-saas/solicitacoes/resumo/',
    '/api/admin-saas/logs/',
    '/api/admin-saas/logs/{id}/',
    '/api/admin-saas/logs/por_acao/',
    '/api/admin-saas/logs/ultimos_30_dias/',
  ],
  admin: [
    '/api/admin/minha_empresa/',
    '/api/admin/minhas_empresas/',
    '/api/admin/selecionar_empresa/',
    '/api/admin/criar_empresa/',
    '/api/admin/listar_departamentos/',
    '/api/admin/criar_departamento/',
    '/api/admin/listar_postos/',
    '/api/admin/criar_posto/',
    '/api/admin/listar_supervisores/',
    '/api/admin/criar_supervisor/',
    '/api/admin/criar_rh/',
    '/api/admin/listar_turnos/',
    '/api/admin/criar_turno/',
    '/api/admin/configurar_horarios_globais/',
    '/api/admin/visualizar_horarios_globais/',
    '/api/admin/configurar_horarios_posto/',
    '/api/admin/visualizar_horarios_posto/',
    '/api/admin/aprovar_colaborador/',
    '/api/admin/rejeitar_colaborador/',
    '/api/admin/solicitacoes_colaboradores/',
    '/api/admin/atualizar_empresa/',
    '/api/admin/atribuir_departamento/',
    '/api/departamentos/',
    '/api/departamentos/{uuid}/',
    '/api/roles/',
    '/api/roles/{uuid}/',
    '/api/configuracoes/',
    '/api/configuracoes/{uuid}/',
    '/api/configuracoes/{uuid}/atualizar_horarios/',
    '/api/geofencing/atualizar_geofencing/',
  ],
  rh: [
    '/api/rh/listar_funcionarios/',
    '/api/rh/listar_contratos/',
    '/api/rh/criar_contrato/',
    '/api/rh/renovar_contrato/',
    '/api/rh/validar_contrato/',
    '/api/rh/listar_recibos/',
    '/api/rh/calcular_folha/',
    '/api/rh/gerar_recibo/',
    '/api/rh/gerar_folha_automatica/',
    '/api/rh/exportar_folha/',
    '/api/rh/importar_folha/',
    '/api/rh/exportar_funcionarios/',
    '/api/rh/importar_funcionarios/',
    '/api/rh/listar_feriados/',
    '/api/rh/criar_feriado/',
    '/api/rh/eliminar_feriado/',
    '/api/rh/listar_ferias/',
    '/api/rh/criar_ferias/',
    '/api/rh/processar_ferias/',
    '/api/rh/listar_declaracoes/',
    '/api/rh/enviar_declaracao/',
    '/api/rh/listar_faltas/',
    '/api/rh/eliminar_falta/',
    '/api/rh/exportar_faltas/',
    '/api/rh/decimo_terceiro/',
    '/api/rh/processar_decimo_terceiro/',
    '/api/rh/subsidio_ferias/',
    '/api/rh/configurar_almoco/',
    '/api/rh/configurar_biometrico/',
    '/api/rh/listar_documentos/',
    '/api/rh/criar_documento/',
  ],
  supervisor: [
    '/api/supervisor/listar_colaboradores/',
    '/api/supervisor/listar_escalas/',
    '/api/supervisor/criar_calendario/',
    '/api/supervisor/atribuir_escala/',
    '/api/supervisor/atualizar_dias_trabalho/',
    '/api/supervisor/gerenciar_turno/',
    '/api/supervisor/presencas_pendentes/',
    '/api/supervisor/autorizar_presenca/',
    '/api/supervisor/marcar_falta_colaborador/',
    '/api/supervisor/relatorio_faltas/',
    '/api/supervisor/visualizar_plano_trabalho/',
    '/api/supervisor/atribuir_tarefas/',
  ],
  chefe_departamento: [
    '/api/chefe/minha_equipa/',
  ],
  colaborador: [
    '/api/colaborador/marcar_presenca/',
    '/api/colaborador/marcar_presenca_fora/',
    '/api/colaborador/iniciar_almoco/',
    '/api/colaborador/terminar_almoco/',
    '/api/colaborador/meu_almoco/',
    '/api/colaborador/meu_resumo/',
    '/api/colaborador/meu_horario/',
    '/api/colaborador/meu_calendario/',
    '/api/colaborador/minhas_tarefas/',
    '/api/colaborador/marcar_tarefa_concluida/',
    '/api/colaborador/minhas_ferias/',
    '/api/colaborador/solicitar_ferias/',
    '/api/colaborador/minhas_declaracoes/',
    '/api/colaborador/meus_recibos/',
    '/api/colaborador/status_contrato/',
    '/api/colaborador/meus_atrasos/',
    '/api/colaborador/noticias/',
    '/api/colaborador/registar_gasto/',
    '/api/colaborador/eliminar_gasto/',
    '/api/colaborador/meus_gastos/',
    '/api/colaborador/fugas_de_dinheiro/',
    '/api/colaborador/minha_economia/',
  ],
};

// ─── Auth ─────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/api/auth/login/', { email, password }).then(r => r.data),

  refresh: (refresh: string) =>
    api.post<{ access: string; refresh: string }>('/api/auth/refresh/', { refresh }).then(r => r.data),

  profile: () =>
    api.get<ProfileResponse>('/api/empresas/meu_perfil/').then(r => r.data),
};

// ─── Admin endpoints ───────────────────────────────────────────────
export const adminApi = {
  getMyCompany: () =>
    api.get('/api/admin/minha_empresa/').then(r => r.data),

  listMyCompanies: () =>
    api.get('/api/admin/minhas_empresas/').then(r => r.data),

  selectCompany: (body: { empresa_id: ResourceId }) =>
    api.post('/api/admin/selecionar_empresa/', body).then(r => r.data),

  createCompany: (body: Record<string, unknown>) =>
    api.post('/api/admin/criar_empresa/', body).then(r => r.data),

  listDepartments: () =>
    api.get('/api/admin/listar_departamentos/').then(r => r.data),

  createDepartment: (body: { nome: string; descricao?: string }) =>
    api.post('/api/admin/criar_departamento/', body).then(r => r.data),

  listPosts: () =>
    api.get('/api/admin/listar_postos/').then(r => r.data),

  createPost: (body: Record<string, unknown>) =>
    api.post('/api/admin/criar_posto/', body).then(r => r.data),

  listSupervisors: () =>
    api.get('/api/admin/listar_supervisores/').then(r => r.data),

  createSupervisor: (body: { username: string; email: string; nome: string; senha: string; departamento_id?: number }) =>
    api.post('/api/admin/criar_supervisor/', body).then(r => r.data),

  createRh: (body: { username: string; email: string; nome: string; senha: string }) =>
    api.post('/api/admin/criar_rh/', body).then(r => r.data),

  listTurnos: () =>
    api.get('/api/admin/listar_turnos/').then(r => r.data),

  createTurno: (body: Record<string, unknown>) =>
    api.post('/api/admin/criar_turno/', body).then(r => r.data),

  setGlobalSchedule: (body: { horario_entrada: string; horario_saida: string; horario_almoco_inicio: string; horario_almoco_fim: string }) =>
    api.post('/api/admin/configurar_horarios_globais/', body).then(r => r.data),

  getGlobalSchedule: () =>
    api.get('/api/admin/visualizar_horarios_globais/').then(r => r.data),

  setPostSchedule: (body: { posto_id: number; horario_entrada: string; horario_saida: string; horario_almoco_inicio: string; horario_almoco_fim: string }) =>
    api.post('/api/admin/configurar_horarios_posto/', body).then(r => r.data),

  getPostSchedule: (params?: { posto_id?: number }) =>
    api.get('/api/admin/visualizar_horarios_posto/', { params }).then(r => r.data),

  approveEmployee: (body: Record<string, unknown>) =>
    api.post('/api/admin/aprovar_colaborador/', body).then(r => r.data),

  rejectEmployee: (body: Record<string, unknown>) =>
    api.post('/api/admin/rejeitar_colaborador/', body).then(r => r.data),

  listEmployeeRequests: () =>
    api.get('/api/admin/solicitacoes_colaboradores/').then(r => r.data),

  updateCompany: (body: Record<string, unknown>) =>
    api.post('/api/admin/atualizar_empresa/', body).then(r => r.data),

  assignDepartment: (body: Record<string, unknown>) =>
    api.post('/api/admin/atribuir_departamento/', body).then(r => r.data),
};

// ─── Companies (CRUD, Paginated) ───────────────────────────────────
export const companiesApi = {
  list: (page = 1) =>
    api.get('/api/empresas/', { params: { page } }).then(r => r.data),

  get: (uuid: ResourceId) =>
    api.get(`/api/empresas/${uuid}/`).then(r => r.data),

  publicRegister: (body: Record<string, unknown>) =>
    api.post('/api/empresas/cadastro_publico/', body).then(r => r.data),

  myCompany: () =>
    api.get('/api/empresas/minha_empresa/').then(r => r.data),
};

// ─── Departments (Paginated CRUD) ─────────────────────────────────
export const departmentsApi = {
  list: (page = 1) =>
    api.get('/api/departamentos/', { params: { page } }).then(r => r.data),

  get: (uuid: ResourceId) =>
    api.get(`/api/departamentos/${uuid}/`).then(r => r.data),

  create: (body: Record<string, unknown>) =>
    api.post('/api/departamentos/', body).then(r => r.data),

  update: (uuid: ResourceId, body: Record<string, unknown>) =>
    api.put(`/api/departamentos/${uuid}/`, body).then(r => r.data),

  patch: (uuid: ResourceId, body: Record<string, unknown>) =>
    api.patch(`/api/departamentos/${uuid}/`, body).then(r => r.data),

  delete: (uuid: ResourceId) =>
    api.delete(`/api/departamentos/${uuid}/`).then(r => r.data),
};

// ─── Roles (ColaboradorRole) ───────────────────────────────────────
export const rolesApi = {
  list: (page = 1) =>
    api.get('/api/roles/', { params: { page } }).then(r => r.data),

  get: (uuid: ResourceId) =>
    api.get(`/api/roles/${uuid}/`).then(r => r.data),

  create: (body: Record<string, unknown>) =>
    api.post('/api/roles/', body).then(r => r.data),

  update: (uuid: ResourceId, body: Record<string, unknown>) =>
    api.put(`/api/roles/${uuid}/`, body).then(r => r.data),

  patch: (uuid: ResourceId, body: Record<string, unknown>) =>
    api.patch(`/api/roles/${uuid}/`, body).then(r => r.data),

  delete: (uuid: ResourceId) =>
    api.delete(`/api/roles/${uuid}/`).then(r => r.data),
};

// ─── Configurations ────────────────────────────────────────────────
export const configApi = {
  list: (page = 1) =>
    api.get('/api/configuracoes/', { params: { page } }).then(r => r.data),

  get: (uuid: ResourceId) =>
    api.get(`/api/configuracoes/${uuid}/`).then(r => r.data),

  create: (body: Record<string, unknown>) =>
    api.post('/api/configuracoes/', body).then(r => r.data),

  update: (uuid: ResourceId, body: Record<string, unknown>) =>
    api.put(`/api/configuracoes/${uuid}/`, body).then(r => r.data),

  patch: (uuid: ResourceId, body: Record<string, unknown>) =>
    api.patch(`/api/configuracoes/${uuid}/`, body).then(r => r.data),

  delete: (uuid: ResourceId) =>
    api.delete(`/api/configuracoes/${uuid}/`).then(r => r.data),

  updateSchedule: (uuid: ResourceId, body: Record<string, unknown>) =>
    api.post(`/api/configuracoes/${uuid}/atualizar_horarios/`, body).then(r => r.data),
};

// ─── RH endpoints ─────────────────────────────────────────────────
export const rhApi = {
  listEmployees: () =>
    api.get('/api/rh/listar_funcionarios/').then(r => r.data),

  listContracts: () =>
    api.get('/api/rh/listar_contratos/').then(r => r.data),

  createContract: (body: Record<string, unknown>) =>
    api.post('/api/rh/criar_contrato/', body).then(r => r.data),

  renewContract: (body: { contrato_id: number; nova_data_fim: string; novo_salario?: number }) =>
    api.post('/api/rh/renovar_contrato/', body).then(r => r.data),

  validateContract: (contrato_id: number) =>
    api.post('/api/rh/validar_contrato/', { contrato_id }).then(r => r.data),

  listPayroll: () =>
    api.get('/api/rh/listar_recibos/').then(r => r.data),

  calculatePayroll: (body: Record<string, unknown>) =>
    api.post('/api/rh/calcular_folha/', body).then(r => r.data),

  generateReceipt: (body: Record<string, unknown>) =>
    api.post('/api/rh/gerar_recibo/', body).then(r => r.data),

  generateAutoPayroll: (body: Record<string, unknown>) =>
    api.post('/api/rh/gerar_folha_automatica/', body).then(r => r.data),

  exportPayroll: (params?: Record<string, unknown>) =>
    api.get('/api/rh/exportar_folha/', { params }).then(r => r.data),

  importPayroll: (body: Record<string, unknown>) =>
    api.post('/api/rh/importar_folha/', body).then(r => r.data),

  exportEmployees: (params?: Record<string, unknown>) =>
    api.get('/api/rh/exportar_funcionarios/', { params }).then(r => r.data),

  importEmployees: (body: Record<string, unknown>) =>
    api.post('/api/rh/importar_funcionarios/', body).then(r => r.data),

  listHolidays: () =>
    api.get('/api/rh/listar_feriados/').then(r => r.data),

  createHoliday: (body: { data: string; nome: string; tipo?: string; nacional?: boolean; recorrente?: boolean }) =>
    api.post('/api/rh/criar_feriado/', body).then(r => r.data),

  deleteHoliday: (feriado_id: number) =>
    api.post('/api/rh/eliminar_feriado/', { feriado_id }).then(r => r.data),

  listVacations: (status?: string) =>
    api.get('/api/rh/listar_ferias/', { params: status ? { status } : undefined }).then(r => r.data),

  createVacation: (body: { colaborador_id: number; data_inicio: string; data_fim: string; motivo?: string }) =>
    api.post('/api/rh/criar_ferias/', body).then(r => r.data),

  processVacation: (body: { ferias_id: number; acao: 'aprovar' | 'rejeitar'; motivo?: string }) =>
    api.post('/api/rh/processar_ferias/', body).then(r => r.data),

  listDeclarations: () =>
    api.get('/api/rh/listar_declaracoes/').then(r => r.data),

  sendDeclaration: (body: { colaborador_id: number; tipo?: string; titulo: string; conteudo: string }) =>
    api.post('/api/rh/enviar_declaracao/', body).then(r => r.data),

  listAbsences: () =>
    api.get('/api/rh/listar_faltas/').then(r => r.data),

  deleteAbsence: (falta_id: number) =>
    api.post('/api/rh/eliminar_falta/', { falta_id }).then(r => r.data),

  exportAbsences: (params?: Record<string, unknown>) =>
    api.get('/api/rh/exportar_faltas/', { params }).then(r => r.data),

  calcThirteenth: (body: { colaborador_id: number; ano?: number; percentual?: number; meses_trabalhados?: number }) =>
    api.post('/api/rh/decimo_terceiro/', body).then(r => r.data),

  processThirteenth: (body: { ano?: number; percentual?: number }) =>
    api.post('/api/rh/processar_decimo_terceiro/', body).then(r => r.data),

  getLunchConfig: () =>
    api.get('/api/rh/configurar_almoco/').then(r => r.data),

  setLunchConfig: (body: { tolerancia_almoco_minutos?: number; descontar_excesso_almoco?: boolean }) =>
    api.post('/api/rh/configurar_almoco/', body).then(r => r.data),

  configureBiometric: (body: Record<string, unknown>) =>
    api.post('/api/rh/configurar_biometrico/', body).then(r => r.data),

  listDocuments: () =>
    api.get('/api/rh/listar_documentos/').then(r => r.data),

  createDocument: (body: Record<string, unknown>) =>
    api.post('/api/rh/criar_documento/', body).then(r => r.data),

  vacationSubsidy: (body: Record<string, unknown>) =>
    api.post('/api/rh/subsidio_ferias/', body).then(r => r.data),
};

// ─── Supervisor endpoints ──────────────────────────────────────────
export const supervisorApi = {
  listEmployees: () =>
    api.get('/api/supervisor/listar_colaboradores/').then(r => r.data),

  listSchedules: () =>
    api.get('/api/supervisor/listar_escalas/').then(r => r.data),

  createSchedule: (body: Record<string, unknown>) =>
    api.post('/api/supervisor/criar_calendario/', body).then(r => r.data),

  assignSchedule: (body: { colaborador_ids: number[]; escala_id: number }) =>
    api.post('/api/supervisor/atribuir_escala/', body).then(r => r.data),

  updateWorkDays: (body: Record<string, unknown>) =>
    api.post('/api/supervisor/atualizar_dias_trabalho/', body).then(r => r.data),

  manageTurno: (body: Record<string, unknown>) =>
    api.post('/api/supervisor/gerenciar_turno/', body).then(r => r.data),

  listPendingPresences: () =>
    api.get('/api/supervisor/presencas_pendentes/').then(r => r.data),

  authorizePresence: (body: { presenca_id: number; acao: 'aprovar' | 'rejeitar'; observacao?: string }) =>
    api.post('/api/supervisor/autorizar_presenca/', body).then(r => r.data),

  markAbsence: (body: Record<string, unknown>) =>
    api.post('/api/supervisor/marcar_falta_colaborador/', body).then(r => r.data),

  absenceReport: () =>
    api.get('/api/supervisor/relatorio_faltas/').then(r => r.data),

  workPlan: () =>
    api.get('/api/supervisor/visualizar_plano_trabalho/').then(r => r.data),

  assignTasks: (body: Record<string, unknown>) =>
    api.post('/api/supervisor/atribuir_tarefas/', body).then(r => r.data),
};

// â”€â”€â”€ Department chief endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const chiefApi = {
  myTeam: () =>
    api.get('/api/chefe/minha_equipa/').then(r => r.data),
};

// â”€â”€â”€ Employee endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const employeeApi = {
  markPresence: (body: Record<string, unknown>) =>
    api.post('/api/colaborador/marcar_presenca/', body).then(r => r.data),

  markPresenceOutside: (body: Record<string, unknown>) =>
    api.post('/api/colaborador/marcar_presenca_fora/', body).then(r => r.data),

  startLunch: (body: Record<string, unknown> = {}) =>
    api.post('/api/colaborador/iniciar_almoco/', body).then(r => r.data),

  endLunch: (body: Record<string, unknown> = {}) =>
    api.post('/api/colaborador/terminar_almoco/', body).then(r => r.data),

  myLunch: () =>
    api.get('/api/colaborador/meu_almoco/').then(r => r.data),

  mySummary: () =>
    api.get('/api/colaborador/meu_resumo/').then(r => r.data),

  mySchedule: () =>
    api.get('/api/colaborador/meu_horario/').then(r => r.data),

  myCalendar: () =>
    api.get('/api/colaborador/meu_calendario/').then(r => r.data),

  myTasks: () =>
    api.get('/api/colaborador/minhas_tarefas/').then(r => r.data),

  completeTask: (body: Record<string, unknown>) =>
    api.post('/api/colaborador/marcar_tarefa_concluida/', body).then(r => r.data),

  myVacations: () =>
    api.get('/api/colaborador/minhas_ferias/').then(r => r.data),

  requestVacation: (body: Record<string, unknown>) =>
    api.post('/api/colaborador/solicitar_ferias/', body).then(r => r.data),

  myDeclarations: () =>
    api.get('/api/colaborador/minhas_declaracoes/').then(r => r.data),

  myReceipts: () =>
    api.get('/api/colaborador/meus_recibos/').then(r => r.data),

  contractStatus: () =>
    api.get('/api/colaborador/status_contrato/').then(r => r.data),

  myDelays: () =>
    api.get('/api/colaborador/meus_atrasos/').then(r => r.data),

  news: () =>
    api.get('/api/colaborador/noticias/').then(r => r.data),

  registerExpense: (body: Record<string, unknown>) =>
    api.post('/api/colaborador/registar_gasto/', body).then(r => r.data),

  deleteExpense: (body: { gasto_id: ResourceId }) =>
    api.post('/api/colaborador/eliminar_gasto/', body).then(r => r.data),

  myExpenses: () =>
    api.get('/api/colaborador/meus_gastos/').then(r => r.data),

  moneyLeaks: () =>
    api.get('/api/colaborador/fugas_de_dinheiro/').then(r => r.data),

  mySavings: () =>
    api.get('/api/colaborador/minha_economia/').then(r => r.data),
};

// ─── SaaS Owner endpoints ──────────────────────────────────────────
export const saasApi = {
  dashboard: () =>
    api.get('/api/admin-saas/dashboard/').then(r => r.data),

  listPlans: (page = 1) =>
    api.get('/api/admin-saas/planos/', { params: { page } }).then(r => r.data),

  getPlan: (id: number) =>
    api.get(`/api/admin-saas/planos/${id}/`).then(r => r.data),

  createPlan: (body: Record<string, unknown>) =>
    api.post('/api/admin-saas/planos/', body).then(r => r.data),

  updatePlan: (id: number, body: Record<string, unknown>) =>
    api.put(`/api/admin-saas/planos/${id}/`, body).then(r => r.data),

  patchPlan: (id: number, body: Record<string, unknown>) =>
    api.patch(`/api/admin-saas/planos/${id}/`, body).then(r => r.data),

  deletePlan: (id: number) =>
    api.delete(`/api/admin-saas/planos/${id}/`).then(r => r.data),

  listSubscriptions: (page = 1) =>
    api.get('/api/admin-saas/assinaturas/', { params: { page } }).then(r => r.data),

  getSubscription: (id: number) =>
    api.get(`/api/admin-saas/assinaturas/${id}/`).then(r => r.data),

  createSubscription: (body: Record<string, unknown>) =>
    api.post('/api/admin-saas/assinaturas/', body).then(r => r.data),

  updateSubscription: (id: number, body: Record<string, unknown>) =>
    api.put(`/api/admin-saas/assinaturas/${id}/`, body).then(r => r.data),

  patchSubscription: (id: number, body: Record<string, unknown>) =>
    api.patch(`/api/admin-saas/assinaturas/${id}/`, body).then(r => r.data),

  deleteSubscription: (id: number) =>
    api.delete(`/api/admin-saas/assinaturas/${id}/`).then(r => r.data),

  cancelSubscription: (id: number, body: Record<string, unknown> = {}) =>
    api.post(`/api/admin-saas/assinaturas/${id}/cancelar/`, body).then(r => r.data),

  generateInvoice: (id: number, body: Record<string, unknown> = {}) =>
    api.post(`/api/admin-saas/assinaturas/${id}/gerar_fatura/`, body).then(r => r.data),

  reactivateSubscription: (id: number, body: Record<string, unknown> = {}) =>
    api.post(`/api/admin-saas/assinaturas/${id}/reativar/`, body).then(r => r.data),

  suspendSubscription: (id: number, body: Record<string, unknown> = {}) =>
    api.post(`/api/admin-saas/assinaturas/${id}/suspender/`, body).then(r => r.data),

  listInvoices: (page = 1) =>
    api.get('/api/admin-saas/faturas/', { params: { page } }).then(r => r.data),

  getInvoice: (id: number) =>
    api.get(`/api/admin-saas/faturas/${id}/`).then(r => r.data),

  markInvoicePaid: (id: number, body: Record<string, unknown> = {}) =>
    api.post(`/api/admin-saas/faturas/${id}/marcar_paga/`, body).then(r => r.data),

  listUsers: (params?: { page?: number; empresa?: string; role?: string }) =>
    api.get('/api/admin-saas/usuarios/', { params }).then(r => r.data),

  getUser: (id: number) =>
    api.get(`/api/admin-saas/usuarios/${id}/`).then(r => r.data),

  patchUser: (id: number, body: Record<string, unknown>) =>
    api.patch(`/api/admin-saas/usuarios/${id}/`, body).then(r => r.data),

  resetUserPassword: (id: number, nova_senha: string) =>
    api.post(`/api/admin-saas/usuarios/${id}/redefinir_senha/`, { nova_senha }).then(r => r.data),

  listRequests: (page = 1) =>
    api.get('/api/admin-saas/solicitacoes/', { params: { page } }).then(r => r.data),

  createRequest: (body: Record<string, unknown>) =>
    api.post('/api/admin-saas/solicitacoes/', body).then(r => r.data),

  getRequest: (id: number) =>
    api.get(`/api/admin-saas/solicitacoes/${id}/`).then(r => r.data),

  updateRequest: (id: number, body: Record<string, unknown>) =>
    api.put(`/api/admin-saas/solicitacoes/${id}/`, body).then(r => r.data),

  patchRequest: (id: number, body: Record<string, unknown>) =>
    api.patch(`/api/admin-saas/solicitacoes/${id}/`, body).then(r => r.data),

  deleteRequest: (id: number) =>
    api.delete(`/api/admin-saas/solicitacoes/${id}/`).then(r => r.data),

  approveRequest: (solicitacao_id: number) =>
    api.post('/api/admin-saas/solicitacoes/aprovar/', { solicitacao_id }).then(r => r.data),

  rejectRequest: (body: { solicitacao_id: number; motivo: string }) =>
    api.post('/api/admin-saas/solicitacoes/rejeitar/', body).then(r => r.data),

  listPendingRequests: () =>
    api.get('/api/admin-saas/solicitacoes/pendentes/').then(r => r.data),

  requestsSummary: () =>
    api.get('/api/admin-saas/solicitacoes/resumo/').then(r => r.data),

  listLogs: (page = 1) =>
    api.get('/api/admin-saas/logs/', { params: { page } }).then(r => r.data),

  getLog: (id: number) =>
    api.get(`/api/admin-saas/logs/${id}/`).then(r => r.data),

  logsByAction: () =>
    api.get('/api/admin-saas/logs/por_acao/').then(r => r.data),

  logsLast30Days: () =>
    api.get('/api/admin-saas/logs/ultimos_30_dias/').then(r => r.data),
};

// â”€â”€â”€ Support endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const supportApi = {
  listTickets: (page = 1) =>
    api.get('/api/suporte/tickets/', { params: { page } }).then(r => r.data),

  createTicket: (body: Record<string, unknown>) =>
    api.post('/api/suporte/tickets/', body).then(r => r.data),

  getTicket: (id: ResourceId) =>
    api.get(`/api/suporte/tickets/${id}/`).then(r => r.data),

  updateTicket: (id: ResourceId, body: Record<string, unknown>) =>
    api.put(`/api/suporte/tickets/${id}/`, body).then(r => r.data),

  patchTicket: (id: ResourceId, body: Record<string, unknown>) =>
    api.patch(`/api/suporte/tickets/${id}/`, body).then(r => r.data),

  deleteTicket: (id: ResourceId) =>
    api.delete(`/api/suporte/tickets/${id}/`).then(r => r.data),

  respondTicket: (id: ResourceId, body: Record<string, unknown>) =>
    api.post(`/api/suporte/tickets/${id}/responder/`, body).then(r => r.data),

  setTicketStatus: (id: ResourceId, body: Record<string, unknown>) =>
    api.post(`/api/suporte/tickets/${id}/definir_status/`, body).then(r => r.data),
};

// â”€â”€â”€ Assistant and biometric endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const assistantApi = {
  tools: () =>
    api.get('/api/assistente/ferramentas/').then(r => r.data),

  ask: (body: Record<string, unknown>) =>
    api.post('/api/assistente/perguntar/', body).then(r => r.data),
};

export const biometricApi = {
  register: (body: Record<string, unknown>) =>
    api.post('/api/biometrico/registrar/', body).then(r => r.data),

  importFile: (body: FormData) =>
    api.post('/api/biometrico/importar_ficheiro/', body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),
};

// ─── Geofencing ────────────────────────────────────────────────────
export const geofencingApi = {
  update: (body: Record<string, unknown>) =>
    api.post('/api/geofencing/atualizar_geofencing/', body).then(r => r.data),
};

// ─── Public register ───────────────────────────────────────────────
export const publicApi = {
  registerEmployee: (body: Record<string, unknown>) =>
    api.post('/api/register/register/', body).then(r => r.data),
};
