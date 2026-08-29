import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, ScanSearch, ArrowLeftRight, Bell, BarChart3, User, Settings, HelpCircle, LogOut, X } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '@/hooks/useAuth';
import { classNames } from '@/utils/helpers';
import type { ReactNode } from 'react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/monitor', label: 'Live Monitor', icon: Activity },
  { to: '/detect', label: 'Manual Analysis', icon: ScanSearch },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/alerts', label: 'Fraud Alerts', icon: Bell },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const bottomNavItems = [
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} />}
      <aside className={classNames(
        'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-surface border-r border-border flex flex-col transition-transform duration-300',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex items-center justify-between px-6 py-6 border-b border-border">
          <Logo />
          <button onClick={onClose} className="lg:hidden text-text-secondary hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) => classNames('nav-link', isActive && 'nav-link-active')}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        
        <div className="px-4 py-6 border-t border-border space-y-1.5">
          {bottomNavItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) => classNames('nav-link', isActive && 'nav-link-active')}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
              </NavLink>
            );
          })}
          <div className="nav-link cursor-default mt-4 opacity-70">
            <HelpCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium text-sm">Help</span>
          </div>
          <button onClick={handleLogout} className="nav-link w-full text-left text-danger hover:bg-danger/10 mt-1">
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export function AdminSidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const items: { to: string; label: string; icon: ReactNode }[] = [
    { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5 shrink-0" /> },
    { to: '/admin/transactions', label: 'Transactions', icon: <ArrowLeftRight className="w-5 h-5 shrink-0" /> },
    { to: '/admin/users', label: 'Users', icon: <User className="w-5 h-5 shrink-0" /> },
    { to: '/admin/fraud-monitoring', label: 'Fraud Monitoring', icon: <ScanSearch className="w-5 h-5 shrink-0" /> },
    { to: '/admin/reports', label: 'Reports', icon: <BarChart3 className="w-5 h-5 shrink-0" /> },
  ];

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} />}
      <aside className={classNames(
        'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-surface border-r border-border flex flex-col transition-transform duration-300',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex items-center justify-between px-6 py-6 border-b border-border">
          <Logo />
          <button onClick={onClose} className="lg:hidden text-text-secondary hover:text-text-primary"><X className="w-5 h-5" /></button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Security Operations</p>
          {items.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/admin'} onClick={onClose}
              className={({ isActive }) => classNames('nav-link', isActive && 'nav-link-active')}>
              {item.icon}<span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-6 border-t border-border space-y-1.5">
          <NavLink to="/settings" className={({ isActive }) => classNames('nav-link', isActive && 'nav-link-active')}>
             <Settings className="w-5 h-5 shrink-0" /><span className="font-medium text-sm">Settings</span>
          </NavLink>
          <button onClick={handleLogout} className="nav-link w-full text-left text-danger hover:bg-danger/10">
            <LogOut className="w-5 h-5 shrink-0" /><span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
