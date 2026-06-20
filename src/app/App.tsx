import { useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './components/pages/LoginPage';
import { useAppStore } from './components/store/app.store';

// ---- Pages lazy-loaded per profile ----
// Shared
const DashboardPage     = lazy(() => import('./components/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const EmployeesPage     = lazy(() => import('./components/pages/EmployeesPage').then(m => ({ default: m.EmployeesPage })));
const DepartmentsPage   = lazy(() => import('./components/pages/DepartmentsPage').then(m => ({ default: m.DepartmentsPage })));
const RolesPage         = lazy(() => import('./components/pages/RolesPage').then(m => ({ default: m.RolesPage })));
const PostsPage         = lazy(() => import('./components/pages/PostsPage').then(m => ({ default: m.PostsPage })));
const SchedulesPage     = lazy(() => import('./components/pages/SchedulesPage').then(m => ({ default: m.SchedulesPage })));
const TimetablesPage    = lazy(() => import('./components/pages/TimetablesPage').then(m => ({ default: m.TimetablesPage })));
const AttendancePage    = lazy(() => import('./components/pages/AttendancePage').then(m => ({ default: m.AttendancePage })));
const RequestsPage      = lazy(() => import('./components/pages/RequestsPage').then(m => ({ default: m.RequestsPage })));
const ReportsPage       = lazy(() => import('./components/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const SupervisorsPage   = lazy(() => import('./components/pages/SupervisorsPage').then(m => ({ default: m.SupervisorsPage })));
const CompaniesPage     = lazy(() => import('./components/pages/CompaniesPage').then(m => ({ default: m.CompaniesPage })));
const SettingsPage      = lazy(() => import('./components/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ProfilePage       = lazy(() => import('./components/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const PublicCompanyRegisterPage = lazy(() => import('./components/pages/PublicCompanyRegisterPage').then(m => ({ default: m.PublicCompanyRegisterPage })));

// RH exclusive
const ContractsPage        = lazy(() => import('./components/pages/ContractsPage').then(m => ({ default: m.ContractsPage })));
const PayrollPage          = lazy(() => import('./components/pages/PayrollPage').then(m => ({ default: m.PayrollPage })));
const HolidaysPage         = lazy(() => import('./components/pages/HolidaysPage').then(m => ({ default: m.HolidaysPage })));
const DeclarationsPage     = lazy(() => import('./components/pages/DeclarationsPage').then(m => ({ default: m.DeclarationsPage })));
const VacationsAbsencesPage= lazy(() => import('./components/pages/VacationsAbsencesPage').then(m => ({ default: m.VacationsAbsencesPage })));

// Supervisor exclusive
const GeofencingAuthPage       = lazy(() => import('./components/pages/GeofencingAuthPage').then(m => ({ default: m.GeofencingAuthPage })));
const TasksPage                = lazy(() => import('./components/pages/TasksPage').then(m => ({ default: m.TasksPage })));

// Admin exclusive
const GeofencingConfigPage = lazy(() => import('./components/pages/GeofencingConfigPage').then(m => ({ default: m.GeofencingConfigPage })));
const UserManagementPage   = lazy(() => import('./components/pages/UserManagementPage').then(m => ({ default: m.UserManagementPage })));

// SaaS Owner exclusive
const AuditPage         = lazy(() => import('./components/pages/AuditPage').then(m => ({ default: m.AuditPage })));
const SaasRequestsPage  = lazy(() => import('./components/pages/SaasRequestsPage').then(m => ({ default: m.SaasRequestsPage })));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});

function PageLoader() {
  return (
    <div className="flex h-full min-h-[50vh] items-center justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm">Carregando...</span>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { theme } = useAppStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <HashRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro-empresa" element={<PublicCompanyRegisterPage />} />
          <Route path="/registro-empresa" element={<PublicCompanyRegisterPage />} />
          <Route element={<AppLayout />}>
            {/* Dashboard (role-aware) */}
            <Route index element={<DashboardPage />} />

            {/* Shared across multiple roles */}
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="requests" element={<RequestsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="schedules" element={<SchedulesPage />} />
            <Route path="timetables" element={<TimetablesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />

            {/* Admin structure */}
            <Route path="departments" element={<DepartmentsPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="posts" element={<PostsPage />} />
            <Route path="supervisors" element={<SupervisorsPage />} />

            {/* Admin exclusive */}
            <Route path="geofencing-config" element={<GeofencingConfigPage />} />
            <Route path="user-management" element={<UserManagementPage />} />

            {/* RH exclusive */}
            <Route path="contracts" element={<ContractsPage />} />
            <Route path="payroll" element={<PayrollPage />} />
            <Route path="holidays" element={<HolidaysPage />} />
            <Route path="declarations" element={<DeclarationsPage />} />
            <Route path="vacations" element={<VacationsAbsencesPage />} />

            {/* Supervisor exclusive */}
            <Route path="geofencing-auth" element={<GeofencingAuthPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="absence-registration" element={<AttendancePage />} />

            {/* SaaS Owner exclusive */}
            <Route path="companies" element={<CompaniesPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="saas-requests" element={<SaasRequestsPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
      <Toaster
        position="top-right"
        richColors
        toastOptions={{ classNames: { toast: 'font-sans text-sm' } }}
      />
    </QueryClientProvider>
  );
}
