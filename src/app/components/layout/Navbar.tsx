import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  Menu, Bell, Sun, Moon, Search, ChevronRight, LogOut, User, Settings, Check,
} from 'lucide-react';
import { useAppStore } from '../store/app.store';
import { ROLE_COLORS, ROLE_LABELS, canAccessPath, normalizeUserRole } from '../lib/nav-config';
import { cn } from '../lib/utils';

const routeLabels: Record<string, string[]> = {
  '/': ['Dashboard'],
  '/employees': ['Funcionários'],
  '/departments': ['Departamentos'],
  '/roles': ['Cargos'],
  '/posts': ['Postos'],
  '/schedules': ['Escalas'],
  '/timetables': ['Horários'],
  '/attendance': ['Presenças'],
  '/requests': ['Solicitações'],
  '/reports': ['Relatórios'],
  '/supervisors': ['Supervisores'],
  '/companies': ['Empresas'],
  '/settings': ['Configurações'],
  '/profile': ['Perfil'],
  '/contracts': ['Contratos'],
  '/payroll': ['Folha de Salário'],
  '/holidays': ['Feriados'],
  '/declarations': ['Declarações'],
  '/vacations': ['Férias e Faltas'],
  '/geofencing-auth': ['Presenças Pendentes'],
  '/tasks': ['Tarefas'],
  '/absence-registration': ['Registo de Faltas'],
  '/geofencing-config': ['Configuração de Geofencing'],
  '/user-management': ['Gestão de Utilizadores'],
  '/audit': ['Auditoria'],
};

const NOTIFS = [
  { id: 1, text: 'João Carlos solicitou férias', time: '5 min atrás', unread: true },
  { id: 2, text: 'Thiago Ribeiro faltou hoje', time: '2 h atrás', unread: true },
  { id: 3, text: '3 atestados aguardando aprovação', time: '4 h atrás', unread: true },
  { id: 4, text: 'Relatório mensal disponível', time: 'Ontem', unread: false },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, theme, toggleTheme, setSidebarMobileOpen } = useAppStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifRead, setNotifRead] = useState<number[]>([]);

  const role = normalizeUserRole(user?.role);
  const crumbs = routeLabels[location.pathname] ?? ['Página'];
  const unreadCount = NOTIFS.filter(n => n.unread && !notifRead.includes(n.id)).length;
  const canOpenSettings = canAccessPath(role, '/settings');

  const logout = useAppStore(s => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card px-4 lg:px-6">
      <button
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors lg:hidden"
        onClick={() => setSidebarMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <span className="text-muted-foreground/60">Electro Time</span>
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" />
            <span className={cn(i === crumbs.length - 1 ? 'font-medium text-foreground' : '')}>{crumb}</span>
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          {searchOpen ? (
            <motion.input
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              autoFocus
              placeholder="Buscar funcionários, departamentos..."
              className="h-8 rounded-lg border border-border bg-input-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              onBlur={() => setSearchOpen(false)}
            />
          ) : null}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
              searchOpen && 'absolute left-0 top-0 z-10'
            )}
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand-blue)] text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-black/10"
              >
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">Notificações</p>
                  <button
                    onClick={() => setNotifRead(NOTIFS.map(n => n.id))}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Check className="h-3 w-3" /> Marcar todas como lidas
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-border">
                  {NOTIFS.map(n => (
                    <div
                      key={n.id}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors',
                        n.unread && !notifRead.includes(n.id) && 'bg-accent/30'
                      )}
                      onClick={() => setNotifRead(p => [...p, n.id])}
                    >
                      {n.unread && !notifRead.includes(n.id) ? (
                        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                      ) : (
                        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-transparent" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{n.text}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
            className="flex h-8 items-center gap-2 rounded-lg px-2 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-blue)] text-[10px] font-bold text-white flex-shrink-0">
              {user?.name.split(' ').map(n => n[0]).slice(0, 2).join('') ?? 'U'}
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-xs font-medium text-foreground leading-none">{user?.name.split(' ')[0]}</span>
              {user?.role && (
                <span className={cn('text-[10px] font-medium leading-none mt-0.5', ROLE_COLORS[role].text)}>
                  {ROLE_LABELS[role]}
                </span>
              )}
            </div>
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-black/10"
              >
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <div className="p-1">
                  <MenuItem icon={User} label="Meu perfil" onClick={() => { navigate('/profile'); setUserMenuOpen(false); }} />
                  {canOpenSettings && (
                    <MenuItem icon={Settings} label="Configurações" onClick={() => { navigate('/settings'); setUserMenuOpen(false); }} />
                  )}
                  <div className="my-1 border-t border-border" />
                  <MenuItem icon={LogOut} label="Sair" onClick={handleLogout} danger />
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
        danger
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-foreground hover:bg-muted'
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {label}
    </button>
  );
}
