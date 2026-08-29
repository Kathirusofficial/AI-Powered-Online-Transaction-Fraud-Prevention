import { useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { AdminSidebar } from './Sidebar';
import Header from './Header';
import { useAuth } from '@/hooks/useAuth';

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of transaction activity and fraud metrics' },
  '/detect': { title: 'Detect Transaction', subtitle: 'Analyze a transaction for fraud risk' },
  '/transactions': { title: 'Transactions', subtitle: 'Browse and search transaction history' },
  '/alerts': { title: 'Fraud Alerts', subtitle: 'Review and manage fraud alerts' },
  '/analytics': { title: 'Analytics', subtitle: 'Deep dive into fraud trends and patterns' },
  '/profile': { title: 'Profile', subtitle: 'Manage your account information' },
  '/settings': { title: 'Settings', subtitle: 'Configure your preferences' },
};

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const meta = pageTitles[location.pathname] || { title: 'Dashboard' };

  return (
    <div className="flex min-h-screen bg-ink-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} title={meta.title} subtitle={meta.subtitle} />
        <main className="flex-1 p-4 lg:p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const adminTitles: Record<string, { title: string; subtitle?: string }> = {
    '/admin': { title: 'Admin Dashboard', subtitle: 'System-wide fraud monitoring overview' },
    '/admin/transactions': { title: 'Transaction Management', subtitle: 'Manage all platform transactions' },
    '/admin/users': { title: 'User Management', subtitle: 'Manage user accounts and roles' },
    '/admin/fraud-monitoring': { title: 'Fraud Monitoring', subtitle: 'Real-time security monitoring' },
    '/admin/reports': { title: 'Reports', subtitle: 'Generate and export fraud detection reports' },
  };
  const meta = adminTitles[location.pathname] || { title: 'Admin' };

  return (
    <div className="flex min-h-screen bg-ink-950">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} title={meta.title} subtitle={meta.subtitle} />
        {user?.role !== 'Admin' && (
          <div className="bg-warning-500/10 border-b border-warning-500/30 px-4 py-2 text-sm text-warning-500 text-center">
            You are viewing the admin panel in demo mode
          </div>
        )}
        <main className="flex-1 p-4 lg:p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
