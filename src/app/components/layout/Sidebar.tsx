import { NavLink, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Zap, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppStore } from '../store/app.store';
import { ROLE_NAV, ROLE_LABELS, ROLE_COLORS, type NavItem } from '../lib/nav-config';

export function Sidebar() {
  const { user, sidebarCollapsed, toggleSidebar, sidebarMobileOpen, setSidebarMobileOpen, logout } = useAppStore();
  const navigate = useNavigate();

  const role = user?.role ?? 'admin';
  const navSections = ROLE_NAV[role] ?? [];
  const roleColors = ROLE_COLORS[role];
  const roleLabel = ROLE_LABELS[role];
  const collapsed = sidebarCollapsed;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarMobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full flex-col overflow-hidden',
          'bg-[var(--sidebar)] border-r border-[var(--sidebar-border)]',
          'lg:relative lg:translate-x-0',
          sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        style={{ width: collapsed ? 64 : 256 }}
      >
        {/* Logo row */}
        <div className={cn(
          'flex h-16 flex-shrink-0 items-center border-b border-[var(--sidebar-border)] px-3',
          collapsed ? 'justify-center' : 'justify-between'
        )}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--brand-blue)]">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  <p className="text-sm font-bold text-white leading-none">Electro Time</p>
                  <p className="text-[10px] text-[var(--sidebar-foreground)] leading-none mt-0.5">Gestão de Ponto</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!collapsed && (
            <button
              onClick={toggleSidebar}
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Role badge */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-3 pt-3 pb-1">
                <div className={cn(
                  'flex items-center gap-2 rounded-lg border px-2.5 py-1.5',
                  roleColors.bg, roleColors.border
                )}>
                  <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', roleColors.dot)} />
                  <span className={cn('text-[11px] font-semibold truncate', roleColors.text)}>{roleLabel}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col overflow-y-auto px-2 py-2 gap-0.5 scrollbar-none">
          {navSections.map((section, si) => (
            <div key={si}>
              {/* Section title */}
              <AnimatePresence>
                {!collapsed && section.title && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--sidebar-foreground)]/50 select-none"
                  >
                    {section.title}
                  </motion.p>
                )}
              </AnimatePresence>
              {/* Section divider when collapsed */}
              {collapsed && si > 0 && (
                <div className="my-2 border-t border-[var(--sidebar-border)]" />
              )}
              {/* Items */}
              {section.items.map(item => (
                <SidebarNavLink
                  key={item.to}
                  item={item}
                  collapsed={collapsed}
                  onNavigate={() => setSidebarMobileOpen(false)}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-[var(--sidebar-border)] p-2 space-y-1">
          <AnimatePresence>
            {!collapsed && user && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2"
              >
                <UserAvatar name={user.name} />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-xs font-medium text-[var(--sidebar-accent-foreground)]">{user.name}</p>
                  <p className="truncate text-[10px] text-[var(--sidebar-foreground)]">{user.email}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleLogout}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-[var(--sidebar-foreground)]',
              'hover:bg-red-500/10 hover:text-red-400 transition-colors',
              collapsed && 'justify-center'
            )}
            title="Sair"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap text-sm"
                >
                  Sair
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Expand button (when collapsed) */}
        {collapsed && (
          <button
            onClick={toggleSidebar}
            className="absolute bottom-20 right-0 translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--sidebar-border)] bg-[var(--sidebar)] text-[var(--sidebar-foreground)] hover:text-white shadow-sm"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </motion.aside>
    </>
  );
}

function UserAvatar({ name }: { name: string }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('');
  return (
    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand-blue)] text-[10px] font-bold text-white">
      {initials}
    </div>
  );
}

function SidebarNavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.exact ?? item.to === '/'}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors',
          collapsed && 'justify-center',
          isActive
            ? 'bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)] font-medium'
            : 'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]/50 hover:text-[var(--sidebar-accent-foreground)]'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-[var(--sidebar-primary)]' : '')} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 overflow-hidden whitespace-nowrap"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Badge */}
          {item.badge !== undefined && item.badge > 0 && (
            <AnimatePresence>
              {collapsed ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white"
                >
                  {item.badge}
                </motion.span>
              ) : (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
                >
                  {item.badge}
                </motion.span>
              )}
            </AnimatePresence>
          )}
        </>
      )}
    </NavLink>
  );
}
