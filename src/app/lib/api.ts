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

  get: (id: number) =>
    api.get(`/api/empresas/${id}/`).then(r => r.data),

  publicRegister: (body: Record<string, unknown>) =>
    api.post('/api/empresas/cadastro_publico/', body).then(r => r.data),

  myCompany: () =>
    api.get('/api/empresas/minha_empresa/').then(r => r.data),
};

// ─── Departments (Paginated CRUD) ─────────────────────────────────
export const departmentsApi = {
  list: (page = 1) =>
    api.get('/api/departamentos/', { params: { page } }).then(r => r.data),

  get: (id: number) =>
    api.get(`/api/departamentos/${id}/`).then(r => r.data),

  create: (body: Record<string, unknown>) =>
    api.post('/api/departamentos/', body).then(r => r.data),

  update: (id: number, body: Record<string, unknown>) =>
    api.put(`/api/departamentos/${id}/`, body).then(r => r.data),

  patch: (id: number, body: Record<string, unknown>) =>
    api.patch(`/api/departamentos/${id}/`, body).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/api/departamentos/${id}/`).then(r => r.data),
};

// ─── Roles (ColaboradorRole) ───────────────────────────────────────
export const rolesApi = {
  list: (page = 1) =>
    api.get('/api/roles/', { params: { page } }).then(r => r.data),

  get: (id: number) =>
    api.get(`/api/roles/${id}/`).then(r => r.data),

  create: (body: Record<string, unknown>) =>
    api.post('/api/roles/', body).then(r => r.data),

  update: (id: number, body: Record<string, unknown>) =>
    api.put(`/api/roles/${id}/`, body).then(r => r.data),

  patch: (id: number, body: Record<string, unknown>) =>
    api.patch(`/api/roles/${id}/`, body).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/api/roles/${id}/`).then(r => r.data),
};

// ─── Configurations ────────────────────────────────────────────────
export const configApi = {
  list: (page = 1) =>
    api.get('/api/configuracoes/', { params: { page } }).then(r => r.data),

  get: (id: number) =>
    api.get(`/api/configuracoes/${id}/`).then(r => r.data),

  create: (body: Record<string, unknown>) =>
    api.post('/api/configuracoes/', body).then(r => r.data),

  update: (id: number, body: Record<string, unknown>) =>
    api.put(`/api/configuracoes/${id}/`, body).then(r => r.data),

  patch: (id: number, body: Record<string, unknown>) =>
    api.patch(`/api/configuracoes/${id}/`, body).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/api/configuracoes/${id}/`).then(r => r.data),

  updateSchedule: (id: number, body: Record<string, unknown>) =>
    api.post(`/api/configuracoes/${id}/atualizar_horarios/`, body).then(r => r.data),
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

// ─── SaaS Owner endpoints ──────────────────────────────────────────
export const saasApi = {
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
