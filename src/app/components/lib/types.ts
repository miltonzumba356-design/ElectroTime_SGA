// ============================================================
// ELECTRO TIME — Domain Types
// ============================================================

export type UserRole =
  | 'dono_saas'
  | 'admin'
  | 'rh'
  | 'supervisor'
  | 'chefe_departamento'
  | 'colaborador';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  company_id: string;
  company_name: string;
  department_id?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ---- Company (Empresa) ----
export type PlanType = 'basic' | 'professional' | 'enterprise';

export interface Company {
  id: string;
  name: string;
  trade_name: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  logo?: string;
  active: boolean;
  plan: PlanType;
  employee_count: number;
  created_at: string;
}

// ---- Department (Departamento) ----
export interface Department {
  id: string;
  name: string;
  code: string;
  company_id: string;
  manager_id?: string;
  manager_name?: string;
  employee_count: number;
  active: boolean;
  created_at: string;
}

// ---- Role (Cargo) ----
export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  company_id: string;
  department_id?: string;
  department_name?: string;
  cbo?: string;
  salary_min?: number;
  salary_max?: number;
  active: boolean;
  employee_count: number;
  created_at: string;
}

// ---- Post (Posto) ----
export interface Post {
  id: string;
  name: string;
  code: string;
  company_id: string;
  location: string;
  description?: string;
  employee_count: number;
  active: boolean;
  created_at: string;
}

// ---- Schedule (Escala) ----
export type ScheduleType = 'fixed' | '5x2' | '6x1' | '12x36' | 'custom';

export interface Schedule {
  id: string;
  name: string;
  company_id: string;
  type: ScheduleType;
  days_of_week: number[];
  active: boolean;
  timetable_count: number;
  employee_count: number;
  created_at: string;
}

// ---- Timetable (Horário) ----
export interface Timetable {
  id: string;
  name: string;
  company_id: string;
  schedule_id: string;
  schedule_name?: string;
  entry_time: string;
  exit_time: string;
  break_start?: string;
  break_end?: string;
  total_hours: number;
  tolerance_entry: number;
  tolerance_exit: number;
  active: boolean;
  created_at: string;
}

// ---- Employee (Funcionário) ----
export type EmployeeStatus = 'active' | 'inactive' | 'vacation' | 'leave';
export type EmployeeGender = 'M' | 'F' | 'other';
export type ContractType = 'clt' | 'pj' | 'intern' | 'temp';

export interface Employee {
  id: string;
  registration: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  rg?: string;
  birth_date: string;
  gender: EmployeeGender;
  photo?: string;
  hire_date: string;
  dismissal_date?: string;
  status: EmployeeStatus;
  contract_type: ContractType;
  company_id: string;
  department_id: string;
  department_name?: string;
  role_id: string;
  role_name?: string;
  post_id?: string;
  post_name?: string;
  timetable_id?: string;
  timetable_name?: string;
  supervisor_id?: string;
  supervisor_name?: string;
  bank_hours_balance: number;
  overtime_hours: number;
  created_at: string;
}

// ---- Attendance (Presença) ----
export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'late'
  | 'justified'
  | 'holiday'
  | 'vacation'
  | 'leave';

export interface Attendance {
  id: string;
  employee_id: string;
  employee_name?: string;
  employee_registration?: string;
  department_name?: string;
  date: string;
  entry_time?: string;
  exit_time?: string;
  entry_late_minutes?: number;
  overtime_minutes?: number;
  status: AttendanceStatus;
  justified: boolean;
  justification?: string;
  notes?: string;
}

// ---- Request (Solicitação) ----
export type RequestType =
  | 'vacation'
  | 'leave'
  | 'overtime_bank'
  | 'schedule_change'
  | 'document_request'
  | 'advance'
  | 'other';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Request {
  id: string;
  employee_id: string;
  employee_name?: string;
  employee_registration?: string;
  department_name?: string;
  type: RequestType;
  status: RequestStatus;
  start_date: string;
  end_date?: string;
  days?: number;
  description: string;
  reviewer_id?: string;
  reviewer_name?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
}

// ---- Supervisor ----
export interface Supervisor {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  company_id: string;
  department_id: string;
  department_name?: string;
  role_id?: string;
  role_name?: string;
  employee_count: number;
  active: boolean;
  created_at: string;
}

// ---- Dashboard ----
export interface DashboardStats {
  employees: {
    total: number;
    active: number;
    inactive: number;
    on_vacation: number;
  };
  today: {
    present: number;
    absent: number;
    late: number;
    overtime_hours: number;
  };
  pending_requests: number;
  total_departments: number;
  total_posts: number;
  bank_hours_balance: number;
}

export interface AttendanceChartData {
  date: string;
  present: number;
  absent: number;
  late: number;
  overtime?: number;
}

export interface DeptChartData {
  name: string;
  value: number;
  color: string;
}

// ---- Pagination ----
export interface PaginationMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface TableQueryParams {
  page: number;
  per_page: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  [key: string]: any;
}
