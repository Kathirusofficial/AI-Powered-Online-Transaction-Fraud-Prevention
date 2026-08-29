import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface User {
  name: string;
  email: string;
  role: 'Admin' | 'Analyst' | 'User';
}

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('fraudshield_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (email: string, _password: string) => {
    await new Promise(r => setTimeout(r, 600));
    if (!email || !_password) return { ok: false, error: 'Invalid credentials' };
    const role: User['role'] = email.toLowerCase().startsWith('admin') ? 'Admin' : email.toLowerCase().startsWith('analyst') ? 'Analyst' : 'User';
    const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const u = { name, email, role };
    setUser(u);
    localStorage.setItem('fraudshield_user', JSON.stringify(u));
    return { ok: true };
  }, []);

  const register = useCallback(async (name: string, email: string, _password: string) => {
    await new Promise(r => setTimeout(r, 600));
    const u = { name, email, role: 'User' as const };
    setUser(u);
    localStorage.setItem('fraudshield_user', JSON.stringify(u));
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('fraudshield_user');
  }, []);

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
