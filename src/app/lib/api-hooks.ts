import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminApi, companiesApi, departmentsApi, rolesApi, configApi,
  rhApi, supervisorApi, saasApi, geofencingApi, publicApi, authApi,
} from './api';

// ─── Query Keys ───────────────────────────────────────────────────
export const QK = {
  myCompany:         ['my-company'],
  myProfile:         ['my-profile'],
  departments:       ['departments'],
  departmentsList:   ['departments', 'list'],
  posts:             ['posts'],
  supervisors:       ['supervisors'],
  turnos:            ['turnos'],
  globalSchedule:    ['global-schedule'],
  companies:         (page: number) => ['companies', page],
  companyDetail:     (id: number) => ['companies', id],
  roles:             (page: number) => ['roles', page],
  config:            (page: number) => ['config', page],
  employees:         ['employees'],
  contracts:         ['contracts'],
  payroll:           ['payroll'],
  holidays:          ['holidays'],
  vacations:         (status?: string) => ['vacations', status],
  declarations:      ['declarations'],
  absences:          ['absences'],
  pendingPresences:  ['pending-presences'],
  absenceReport:     ['absence-report'],
  schedulesList:     ['schedules'],
  workPlan:          ['work-plan'],
  saasRequests:      (page: number) => ['saas-requests', page],
  saasRequest:       (id: number) => ['saas-request', id],
  saasRequestsPending: ['saas-requests-pending'],
  saasRequestsSummary: ['saas-requests-summary'],
  saasDashboard:     ['saas-dashboard'],
  saasPlans:         (page: number) => ['saas-plans', page],
  saasSubscriptions: (page: number) => ['saas-subscriptions', page],
  saasInvoices:      (page: number) => ['saas-invoices', page],
  saasUsers:         (params?: { page?: number; empresa?: string; role?: string }) => ['saas-users', params ?? {}],
  saasLogs:          (page: number) => ['saas-logs', page],
  saasLogsLast30:    ['saas-logs-30d'],
  saasLogsByAction:  ['saas-logs-by-action'],
  employeeRequests:  ['employee-requests'],
  lunchConfig:       ['lunch-config'],
};

// ─── Admin ────────────────────────────────────────────────────────
export function useMyCompany() {
  return useQuery({ queryKey: QK.myCompany, queryFn: adminApi.getMyCompany });
}

export function useMyProfile() {
  return useQuery({ queryKey: QK.myProfile, queryFn: authApi.profile });
}

export function useAdminDepartments() {
  return useQuery({ queryKey: QK.departmentsList, queryFn: adminApi.listDepartments });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createDepartment,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.departmentsList }),
  });
}

export function usePosts() {
  return useQuery({ queryKey: QK.posts, queryFn: adminApi.listPosts });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createPost,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.posts }),
  });
}

export function useAdminSupervisors() {
  return useQuery({ queryKey: QK.supervisors, queryFn: adminApi.listSupervisors });
}

export function useCreateSupervisor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createSupervisor,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.supervisors }),
  });
}

export function useCreateRh() {
  return useMutation({ mutationFn: adminApi.createRh });
}

export function useTurnos() {
  return useQuery({ queryKey: QK.turnos, queryFn: adminApi.listTurnos });
}

export function useCreateTurno() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createTurno,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.turnos }),
  });
}

export function useGlobalSchedule() {
  return useQuery({ queryKey: QK.globalSchedule, queryFn: adminApi.getGlobalSchedule });
}

export function useSetGlobalSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.setGlobalSchedule,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.globalSchedule }),
  });
}

export function useSetPostSchedule() {
  return useMutation({ mutationFn: adminApi.setPostSchedule });
}

export function usePostSchedule(params?: { posto_id?: number }) {
  return useQuery({
    queryKey: ['post-schedule', params?.posto_id ?? 'all'],
    queryFn: () => adminApi.getPostSchedule(params),
  });
}

export function useEmployeeRequests() {
  return useQuery({ queryKey: QK.employeeRequests, queryFn: adminApi.listEmployeeRequests });
}

export function useApproveEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.approveEmployee,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.employeeRequests }),
  });
}

export function useRejectEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.rejectEmployee,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.employeeRequests }),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.updateCompany,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.myCompany }),
  });
}

export function useAssignDepartment() {
  return useMutation({ mutationFn: adminApi.assignDepartment });
}

// ─── Companies ────────────────────────────────────────────────────
export function useCompanies(page = 1) {
  return useQuery({ queryKey: QK.companies(page), queryFn: () => companiesApi.list(page) });
}

export function useCompany(id: number) {
  return useQuery({ queryKey: QK.companyDetail(id), queryFn: () => companiesApi.get(id), enabled: !!id });
}

export function useMyCompanyDetail() {
  return useQuery({ queryKey: ['my-company-detail'], queryFn: companiesApi.myCompany });
}

export function usePublicRegisterCompany() {
  return useMutation({ mutationFn: companiesApi.publicRegister });
}

// ─── Departments (Paginated) ───────────────────────────────────────
export function useDepartments(page = 1) {
  return useQuery({ queryKey: QK.departments, queryFn: () => departmentsApi.list(page) });
}

export function useCreateDepartmentCrud() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: departmentsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK.departments }); qc.invalidateQueries({ queryKey: QK.departmentsList }); },
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) => departmentsApi.update(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK.departments }); qc.invalidateQueries({ queryKey: QK.departmentsList }); },
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => departmentsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK.departments }); qc.invalidateQueries({ queryKey: QK.departmentsList }); },
  });
}

// ─── Roles ────────────────────────────────────────────────────────
export function useRoles(page = 1) {
  return useQuery({ queryKey: QK.roles(page), queryFn: () => rolesApi.list(page) });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rolesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) => rolesApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => rolesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
}

// ─── Config ───────────────────────────────────────────────────────
export function useConfig(page = 1) {
  return useQuery({ queryKey: QK.config(page), queryFn: () => configApi.list(page) });
}

export function useUpdateConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) => configApi.patch(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config'] }),
  });
}

// ─── RH ───────────────────────────────────────────────────────────
export function useEmployees() {
  return useQuery({ queryKey: QK.employees, queryFn: rhApi.listEmployees });
}

export function useContracts() {
  return useQuery({ queryKey: QK.contracts, queryFn: rhApi.listContracts });
}

export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rhApi.createContract,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.contracts }),
  });
}

export function useRenewContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rhApi.renewContract,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.contracts }),
  });
}

export function useValidateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rhApi.validateContract,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.contracts }),
  });
}

export function usePayroll() {
  return useQuery({ queryKey: QK.payroll, queryFn: rhApi.listPayroll });
}

export function useCalculatePayroll() {
  return useMutation({ mutationFn: rhApi.calculatePayroll });
}

export function useGenerateReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rhApi.generateReceipt,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.payroll }),
  });
}

export function useGenerateAutoPayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rhApi.generateAutoPayroll,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.payroll }),
  });
}

export function useImportPayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rhApi.importPayroll,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.payroll }),
  });
}

export function useImportEmployees() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rhApi.importEmployees,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.employees }),
  });
}

export function useHolidays() {
  return useQuery({ queryKey: QK.holidays, queryFn: rhApi.listHolidays });
}

export function useCreateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rhApi.createHoliday,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.holidays }),
  });
}

export function useDeleteHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => rhApi.deleteHoliday(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.holidays }),
  });
}

export function useVacations(status?: string) {
  return useQuery({ queryKey: QK.vacations(status), queryFn: () => rhApi.listVacations(status) });
}

export function useCreateVacation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rhApi.createVacation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vacations'] }),
  });
}

export function useProcessVacation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rhApi.processVacation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vacations'] }),
  });
}

export function useDeclarations() {
  return useQuery({ queryKey: QK.declarations, queryFn: rhApi.listDeclarations });
}

export function useSendDeclaration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rhApi.sendDeclaration,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.declarations }),
  });
}

export function useAbsences() {
  return useQuery({ queryKey: QK.absences, queryFn: rhApi.listAbsences });
}

export function useDeleteAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => rhApi.deleteAbsence(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.absences }),
  });
}

export function useLunchConfig() {
  return useQuery({ queryKey: QK.lunchConfig, queryFn: rhApi.getLunchConfig });
}

export function useSetLunchConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rhApi.setLunchConfig,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.lunchConfig }),
  });
}

// ─── Supervisor ────────────────────────────────────────────────────
export function useSupervisorEmployees() {
  return useQuery({ queryKey: ['supervisor-employees'], queryFn: supervisorApi.listEmployees });
}

export function useSchedules() {
  return useQuery({ queryKey: QK.schedulesList, queryFn: supervisorApi.listSchedules });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: supervisorApi.createSchedule,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.schedulesList }),
  });
}

export function useAssignSchedule() {
  return useMutation({ mutationFn: supervisorApi.assignSchedule });
}

export function usePendingPresences() {
  return useQuery({ queryKey: QK.pendingPresences, queryFn: supervisorApi.listPendingPresences });
}

export function useAuthorizePresence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: supervisorApi.authorizePresence,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.pendingPresences }),
  });
}

export function useMarkAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: supervisorApi.markAbsence,
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK.absenceReport }); qc.invalidateQueries({ queryKey: QK.absences }); },
  });
}

export function useAbsenceReport() {
  return useQuery({ queryKey: QK.absenceReport, queryFn: supervisorApi.absenceReport });
}

export function useWorkPlan() {
  return useQuery({ queryKey: QK.workPlan, queryFn: supervisorApi.workPlan });
}

export function useAssignTasks() {
  return useMutation({ mutationFn: supervisorApi.assignTasks });
}

export function useUpdateWorkDays() {
  return useMutation({ mutationFn: supervisorApi.updateWorkDays });
}

export function useManageTurno() {
  return useMutation({ mutationFn: supervisorApi.manageTurno });
}

// ─── SaaS Owner ───────────────────────────────────────────────────
export function useSaasDashboard() {
  return useQuery({ queryKey: QK.saasDashboard, queryFn: saasApi.dashboard });
}

export function useSaasPlans(page = 1) {
  return useQuery({ queryKey: QK.saasPlans(page), queryFn: () => saasApi.listPlans(page) });
}

export function useCreateSaasPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saasApi.createPlan,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saas-plans'] }),
  });
}

export function usePatchSaasPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) => saasApi.patchPlan(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saas-plans'] }),
  });
}

export function useDeleteSaasPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saasApi.deletePlan,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saas-plans'] }),
  });
}

export function useSaasSubscriptions(page = 1) {
  return useQuery({ queryKey: QK.saasSubscriptions(page), queryFn: () => saasApi.listSubscriptions(page) });
}

export function useCreateSaasSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saasApi.createSubscription,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saas-subscriptions'] });
      qc.invalidateQueries({ queryKey: ['saas-dashboard'] });
    },
  });
}

export function usePatchSaasSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) => saasApi.patchSubscription(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saas-subscriptions'] }),
  });
}

export function useSaasSubscriptionAction(action: 'cancel' | 'generateInvoice' | 'reactivate' | 'suspend') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body?: Record<string, unknown> }) => {
      if (action === 'cancel') return saasApi.cancelSubscription(id, body);
      if (action === 'generateInvoice') return saasApi.generateInvoice(id, body);
      if (action === 'reactivate') return saasApi.reactivateSubscription(id, body);
      return saasApi.suspendSubscription(id, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saas-subscriptions'] });
      qc.invalidateQueries({ queryKey: ['saas-invoices'] });
      qc.invalidateQueries({ queryKey: ['saas-dashboard'] });
    },
  });
}

export function useSaasInvoices(page = 1) {
  return useQuery({ queryKey: QK.saasInvoices(page), queryFn: () => saasApi.listInvoices(page) });
}

export function useMarkSaasInvoicePaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body?: Record<string, unknown> }) => saasApi.markInvoicePaid(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saas-invoices'] });
      qc.invalidateQueries({ queryKey: ['saas-dashboard'] });
    },
  });
}

export function useSaasUsers(params?: { page?: number; empresa?: string; role?: string }) {
  return useQuery({ queryKey: QK.saasUsers(params), queryFn: () => saasApi.listUsers(params) });
}

export function usePatchSaasUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) => saasApi.patchUser(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saas-users'] }),
  });
}

export function useResetSaasUserPassword() {
  return useMutation({
    mutationFn: ({ id, nova_senha }: { id: number; nova_senha: string }) => saasApi.resetUserPassword(id, nova_senha),
  });
}

export function useSaasRequests(page = 1) {
  return useQuery({ queryKey: QK.saasRequests(page), queryFn: () => saasApi.listRequests(page) });
}

export function useSaasRequest(id: number) {
  return useQuery({
    queryKey: QK.saasRequest(id),
    queryFn: () => saasApi.getRequest(id),
    enabled: !!id,
  });
}

export function useCreateSaasRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saasApi.createRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saas-requests'] }),
  });
}

export function useUpdateSaasRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      saasApi.updateRequest(id, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['saas-requests'] });
      qc.invalidateQueries({ queryKey: QK.saasRequest(id) });
    },
  });
}

export function usePatchSaasRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      saasApi.patchRequest(id, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['saas-requests'] });
      qc.invalidateQueries({ queryKey: QK.saasRequest(id) });
    },
  });
}

export function useDeleteSaasRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => saasApi.deleteRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saas-requests'] }),
  });
}

export function useSaasPendingRequests() {
  return useQuery({ queryKey: QK.saasRequestsPending, queryFn: saasApi.listPendingRequests });
}

export function useSaasRequestsSummary() {
  return useQuery({ queryKey: QK.saasRequestsSummary, queryFn: saasApi.requestsSummary });
}

export function useApproveCompanyRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saasApi.approveRequest,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['saas-requests'] }); },
  });
}

export function useRejectCompanyRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saasApi.rejectRequest,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['saas-requests'] }); },
  });
}

export function useSaasLogs(page = 1) {
  return useQuery({ queryKey: QK.saasLogs(page), queryFn: () => saasApi.listLogs(page) });
}

export function useSaasLogsLast30Days() {
  return useQuery({ queryKey: QK.saasLogsLast30, queryFn: saasApi.logsLast30Days });
}

export function useSaasLogsByAction() {
  return useQuery({ queryKey: QK.saasLogsByAction, queryFn: saasApi.logsByAction });
}

// ─── Geofencing ────────────────────────────────────────────────────
export function useUpdateGeofencing() {
  return useMutation({ mutationFn: geofencingApi.update });
}

// ─── Public ───────────────────────────────────────────────────────
export function useRegisterEmployee() {
  return useMutation({ mutationFn: publicApi.registerEmployee });
}
