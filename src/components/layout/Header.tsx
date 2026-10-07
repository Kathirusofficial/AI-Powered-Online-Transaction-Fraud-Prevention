import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, Search, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function Header({ onMenuClick, title, subtitle, actions }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      navigate(`/transactions?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-6 py-4 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={onMenuClick} className="lg:hidden text-text-secondary hover:text-text-primary p-1">
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-text-primary truncate tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-text-secondary truncate mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <div ref={searchRef} className="relative">
            <button onClick={() => setSearchOpen(o => !o)} className="btn-ghost p-2 rounded-full hover:bg-surface">
              <Search className="w-5 h-5" />
            </button>
            {searchOpen && (
              <form onSubmit={handleSearchSubmit} className="absolute right-0 top-full mt-3 w-80 lg:w-96 card shadow-2xl animate-scale-in z-50">
                <div className="p-3 border-b border-border bg-surface rounded-t-xl">
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search transactions by ID or location..."
                    className="input-base text-sm"
                  />
                </div>
                <div className="p-3 bg-surface rounded-b-xl flex justify-between items-center text-xs text-text-secondary">
                  <span>Press Enter to search</span>
                  <button type="submit" className="text-primary font-semibold hover:underline">
                    Search
                  </button>
                </div>
              </form>
            )}
          </div>

          <div ref={notifRef} className="relative">
            <button onClick={() => setNotifOpen(o => !o)} className="btn-ghost p-2 rounded-full hover:bg-surface relative">
              <Bell className="w-5 h-5" />
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-3 w-80 card shadow-2xl animate-scale-in z-50 bg-surface rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surface">
                  <p className="text-sm font-semibold text-text-primary">Notifications</p>
                  <span className="text-xs font-medium text-text-secondary bg-background px-2 py-0.5 rounded-full">0 unread</span>
                </div>
                <div className="max-h-80 overflow-y-auto bg-surface">
                  <p className="p-4 text-sm text-text-secondary text-center">No new notifications</p>
                </div>
                <Link to="/fraud-alerts" onClick={() => setNotifOpen(false)} className="block px-4 py-3 text-center text-sm font-medium text-primary hover:bg-background border-t border-border bg-surface transition-colors">
                  View all alerts
                </Link>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-border mx-1 hidden sm:block"></div>

          <div ref={profileRef} className="relative">
            <button onClick={() => setProfileOpen(o => !o)} className="flex items-center gap-3 p-1 pr-2 rounded-full hover:bg-surface transition-colors border border-transparent hover:border-border">
              <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-text-primary leading-tight">{user?.name || 'User'}</p>
                <p className="text-[11px] text-text-secondary font-medium leading-tight mt-0.5 uppercase tracking-wider">{user?.role || 'User'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-text-secondary hidden md:block" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-3 w-56 card shadow-2xl animate-scale-in z-50 py-2 bg-surface rounded-xl border border-border">
                <div className="px-4 py-3 border-b border-border bg-background/50 mx-2 rounded-lg mb-2">
                  <p className="text-sm text-text-primary font-semibold truncate">{user?.name}</p>
                  <p className="text-xs text-text-secondary truncate mt-0.5">{user?.email}</p>
                </div>
                <Link to="/profile" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background transition-colors mx-2 rounded-md">Profile</Link>
                <Link to="/settings" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background transition-colors mx-2 rounded-md">Settings</Link>
                <Link to="/help" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background transition-colors mx-2 rounded-md">Help & Support</Link>
                {user?.role === 'Admin' && (
                  <Link to="/admin" onClick={() => { setProfileOpen(false); }} className="block px-4 py-2 text-sm text-primary font-medium hover:bg-primary/10 transition-colors border-t border-border mt-1 mx-2 rounded-md">Admin Operations</Link>
                )}
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors border-t border-border mt-2"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
          {actions}
        </div>
      </div>
    </header>
  );
}
