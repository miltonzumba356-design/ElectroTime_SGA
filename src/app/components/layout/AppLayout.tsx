import { Outlet, Navigate, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAppStore } from '../store/app.store';

export function AppLayout() {
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="min-h-full p-4 lg:p-6"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
