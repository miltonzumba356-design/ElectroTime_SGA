import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm, Controller } from 'react-hook-form';
import {
  Plus, Pencil, Trash2, Eye, X, Loader2, UserCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../shared/PageHeader';
import { StatsCard } from '../shared/StatsCard';
import { DataTable, type Column } from '../shared/DataTable';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { EmployeeStatusBadge } from '../shared/StatusBadge';
import type { Employee } from '../lib/types';
import { formatDate, getInitials, cn } from '../lib/utils';
import { useEmployees, useAdminDepartments, useTurnos, useRoles } from '../lib/api-hooks';
import { adaptEmployee, normalizeList } from '../lib/api-adapters';

const CONTRACT_LABELS: Record<string, string> = {
  clt: 'Efetivo', pj: 'Prestador', intern: 'Estágio', temp: 'Temporário',
};

export function EmployeesPage() {
  const { data: rawEmployees, isLoading } = useEmployees();
  const { data: rawDepts } = useAdminDepartments();
  const { data: rawTurnos } = useTurnos();
  const { data: rawRoles } = useRoles();

  const employees: Employee[] = normalizeList(rawEmployees, adaptEmployee);
  const departments = normalizeList(rawDepts, (d: any) => ({ id: String(d.id), name: d.nome ?? d.name ?? '' }));
  const timetables  = normalizeList(rawTurnos, (t: any) => ({ id: String(t.id), name: t.nome ?? t.name ?? '' }));
  const roles       = normalizeList(rawRoles, (r: any) => ({ id: String(r.id), name: r.nome ?? r.name ?? '' }));

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewTarget, setViewTarget] = useState<Employee | null>(null);

  const counts = {
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    inactive: employees.filter(e => e.status === 'inactive').length,
    vacation: employees.filter(e => e.status === 'vacation').length,
    leave: employees.filter(e => e.status === 'leave').length,
  };

  const columns: Column<Employee>[] = [
    {
      key: 'registration',
      header: 'Matrícula',
      sortable: true,
      width: 'w-24',
      cell: r => <span className="font-mono text-xs text-muted-foreground">{r.registration}</span>,
    },
    {
      key: 'name',
      header: 'Funcionário',
      sortable: true,
      cell: r => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {getInitials(r.name)}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{r.name}</p>
            <p className="text-xs text-muted-foreground">{r.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'department_name',
      header: 'Departamento',
      sortable: true,
      cell: r => <span className="text-sm">{r.department_name ?? '—'}</span>,
    },
    {
      key: 'role_name',
      header: 'Cargo',
      sortable: true,
      cell: r => <span className="text-sm">{r.role_name ?? '—'}</span>,
    },
    {
      key: 'contract_type',
      header: 'Contrato',
      cell: r => (
        <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
          {CONTRACT_LABELS[r.contract_type]}
        </span>
      ),
    },
    {
      key: 'hire_date',
      header: 'Admissão',
      sortable: true,
      cell: r => <span className="text-sm">{formatDate(r.hire_date)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: r => <EmployeeStatusBadge status={r.status} />,
    },
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    // The API does not expose a direct employee delete endpoint — show info
    toast.info('Exclusão de funcionários deve ser gerida pelo administrador da empresa.');
    setDeleteTarget(null);
    setDeleteLoading(false);
  };

  const openCreate = () => { setEditTarget(null); setDrawerOpen(true); };
  const openEdit = (emp: Employee) => { setEditTarget(emp); setDrawerOpen(true); };

  const onSave = (_emp: Employee) => {
    toast.info('Gestão de funcionários deve ser feita via importação ERP ou pelo administrador.');
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Funcionários"
        description="Gerencie todos os funcionários da empresa"
        actions={
          <button
            onClick={openCreate}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Funcionário
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <StatsCard title="Total" value={counts.total} color="blue" delay={0} />
        <StatsCard title="Ativos" value={counts.active} color="green" delay={0.05} />
        <StatsCard title="Inativos" value={counts.inactive} color="slate" delay={0.1} />
        <StatsCard title="Em Férias" value={counts.vacation} color="yellow" delay={0.15} />
        <StatsCard title="Afastados" value={counts.leave} color="red" delay={0.2} />
      </div>

      {/* Table */}
      <DataTable
        data={employees}
        columns={columns}
        searchFields={['name', 'email', 'registration', 'department_name', 'role_name']}
        emptyTitle="Nenhum funcionário encontrado"
        emptyDescription="Clique em 'Novo Funcionário' para cadastrar o primeiro."
        rowActions={row => (
          <div className="flex items-center justify-end gap-1">
            <ActionBtn icon={Eye} onClick={() => setViewTarget(row)} title="Ver detalhes" />
            <ActionBtn icon={Pencil} onClick={() => openEdit(row)} title="Editar" />
            <ActionBtn icon={Trash2} onClick={() => setDeleteTarget(row)} title="Excluir" danger />
          </div>
        )}
      />

      {/* Drawer */}
      <EmployeeDrawer
        open={drawerOpen}
        employee={editTarget}
        departments={departments}
        roles={roles}
        timetables={timetables}
        onClose={() => setDrawerOpen(false)}
        onSave={onSave}
      />

      {/* View Modal */}
      <AnimatePresence>
        {viewTarget && (
          <EmployeeViewModal employee={viewTarget} onClose={() => setViewTarget(null)} />
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Excluir funcionário"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />
    </div>
  );
}

function ActionBtn({ icon: Icon, onClick, title, danger }: { icon: any; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
        danger
          ? 'text-muted-foreground hover:bg-red-500/10 hover:text-red-500'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

// ---- Employee Form ----
interface EmployeeForm {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birth_date: string;
  gender: string;
  hire_date: string;
  status: string;
  contract_type: string;
  department_id: string;
  role_id: string;
  timetable_id: string;
}

function EmployeeDrawer({
  open,
  employee,
  departments,
  roles,
  timetables,
  onClose,
  onSave,
}: {
  open: boolean;
  employee: Employee | null;
  departments: { id: string; name: string }[];
  roles: { id: string; name: string }[];
  timetables: { id: string; name: string }[];
  onClose: () => void;
  onSave: (e: Employee) => void;
}) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EmployeeForm>({
    defaultValues: employee ?? {},
  });

  const onSubmit = async (data: EmployeeForm) => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    const dept = departments.find(d => d.id === data.department_id);
    const role = roles.find(r => r.id === data.role_id);
    const timetable = timetables.find(t => t.id === data.timetable_id);
    const saved: Employee = {
      id: employee?.id ?? `e-${Date.now()}`,
      registration: employee?.registration ?? `ET-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      bank_hours_balance: employee?.bank_hours_balance ?? 0,
      overtime_hours: employee?.overtime_hours ?? 0,
      created_at: employee?.created_at ?? new Date().toISOString(),
      company_id: 'c-001',
      ...data,
      department_name: dept?.name,
      role_name: role?.name,
      timetable_name: timetable?.name,
      gender: data.gender as Employee['gender'],
      status: data.status as Employee['status'],
      contract_type: data.contract_type as Employee['contract_type'],
    };
    setSaving(false);
    onSave(saved);
    reset();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 flex h-full w-full max-w-lg flex-col bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {employee ? `Editando ${employee.name}` : 'Preencha os dados do novo colaborador'}
                </p>
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-y-auto">
              <div className="flex-1 space-y-5 px-6 py-5">
                <FormSection title="Dados Pessoais">
                  <FormField label="Nome completo" error={errors.name?.message}>
                    <input {...register('name', { required: 'Obrigatório' })}
                      defaultValue={employee?.name}
                      placeholder="Manuel António"
                      className={inputCls(!!errors.name)} />
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="E-mail" error={errors.email?.message}>
                      <input {...register('email', { required: 'Obrigatório' })}
                        defaultValue={employee?.email}
                        type="email"
                        placeholder="manuel@empresa.ao"
                        className={inputCls(!!errors.email)} />
                    </FormField>
                    <FormField label="Telefone">
                      <input {...register('phone')}
                        defaultValue={employee?.phone}
                        placeholder="+244 9XX XXX XXX"
                        className={inputCls(false)} />
                    </FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="BI" error={errors.cpf?.message}>
                      <input {...register('cpf', { required: 'Obrigatório' })}
                        defaultValue={employee?.cpf}
                        placeholder="000000000LA000"
                        className={inputCls(!!errors.cpf)} />
                    </FormField>
                    <FormField label="Data de Nascimento">
                      <input {...register('birth_date')}
                        defaultValue={employee?.birth_date}
                        type="date"
                        className={inputCls(false)} />
                    </FormField>
                  </div>
                  <FormField label="Gênero">
                    <select {...register('gender')} defaultValue={employee?.gender ?? 'M'} className={inputCls(false)}>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                      <option value="other">Outro</option>
                    </select>
                  </FormField>
                </FormSection>

                <FormSection title="Vínculo Empregatício">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Data de Admissão" error={errors.hire_date?.message}>
                      <input {...register('hire_date', { required: 'Obrigatório' })}
                        defaultValue={employee?.hire_date}
                        type="date"
                        className={inputCls(!!errors.hire_date)} />
                    </FormField>
                    <FormField label="Tipo de Contrato">
                      <select {...register('contract_type')} defaultValue={employee?.contract_type ?? 'clt'} className={inputCls(false)}>
                        <option value="clt">Efetivo</option>
                        <option value="pj">Prestador de serviço</option>
                        <option value="intern">Estágio</option>
                        <option value="temp">Temporário</option>
                      </select>
                    </FormField>
                  </div>
                  <FormField label="Status">
                    <select {...register('status')} defaultValue={employee?.status ?? 'active'} className={inputCls(false)}>
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                      <option value="vacation">Em Férias</option>
                      <option value="leave">Afastado</option>
                    </select>
                  </FormField>
                </FormSection>

                <FormSection title="Alocação">
                  <FormField label="Departamento" error={errors.department_id?.message}>
                    <select {...register('department_id', { required: 'Obrigatório' })} defaultValue={employee?.department_id} className={inputCls(!!errors.department_id)}>
                      <option value="">Selecione...</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Cargo" error={errors.role_id?.message}>
                    <select {...register('role_id', { required: 'Obrigatório' })} defaultValue={employee?.role_id} className={inputCls(!!errors.role_id)}>
                      <option value="">Selecione...</option>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Horário de Trabalho">
                    <select {...register('timetable_id')} defaultValue={employee?.timetable_id} className={inputCls(false)}>
                      <option value="">Selecione...</option>
                      {timetables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </FormField>
                </FormSection>
              </div>

              {/* Footer */}
              <div className="border-t border-border px-6 py-4 flex justify-end gap-2.5">
                <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {employee ? 'Salvar alterações' : 'Cadastrar funcionário'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function EmployeeViewModal({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Detalhes do Funcionário</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-5 pb-5 border-b border-border">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
              {getInitials(employee.name)}
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{employee.name}</h3>
              <p className="text-sm text-muted-foreground">{employee.role_name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{employee.registration}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['E-mail', employee.email],
              ['Telefone', employee.phone],
              ['BI', employee.cpf],
              ['Admissão', formatDate(employee.hire_date)],
              ['Departamento', employee.department_name ?? '—'],
              ['Horário', employee.timetable_name ?? '—'],
              ['Banco de Horas', `${employee.bank_hours_balance > 0 ? '+' : ''}${employee.bank_hours_balance}h`],
              ['H. Extras', `${employee.overtime_hours}h`],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium text-foreground mt-0.5">{val}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

const inputCls = (hasError: boolean) =>
  cn(
    'h-9 w-full rounded-lg border bg-input-background px-3 text-sm text-foreground placeholder:text-muted-foreground',
    'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors',
    hasError ? 'border-destructive' : 'border-border'
  );
