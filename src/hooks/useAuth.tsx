import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('fraudshield_user');
      const token = localStorage.getItem('fraudshield_token');
      if (saved && token && saved !== 'undefined') {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse user from local storage', e);
      localStorage.removeItem('fraudshield_user');
      localStorage.removeItem('fraudshield_token');
    }
    return null;
  });

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token, user } = res.data;
      localStorage.setItem('fraudshield_token', token);
      localStorage.setItem('fraudshield_user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      return { ok: true };
    } catch (err: unknown) {
      const errRes = (err as { response?: { data?: { msg?: string } | string } })?.response;
      let msg = 'Login failed';
      if (errRes?.data) {
        if (typeof errRes.data === 'object' && errRes.data.msg) {
          msg = errRes.data.msg;
        } else if (typeof errRes.data === 'string') {
          msg = errRes.data;
        }
      }
      return { ok: false, error: msg };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { name, email, password });
      const { token, user } = res.data;
      localStorage.setItem('fraudshield_token', token);
      localStorage.setItem('fraudshield_user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      return { ok: true };
    } catch (err: unknown) {
      const errRes = (err as { response?: { data?: { msg?: string } | string } })?.response;
      let msg = 'Registration failed';
      if (errRes?.data) {
        if (typeof errRes.data === 'object' && errRes.data.msg) {
          msg = errRes.data.msg;
        } else if (typeof errRes.data === 'string') {
          msg = errRes.data;
        }
      }
      return { ok: false, error: msg };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('fraudshield_user');
    localStorage.removeItem('fraudshield_token');
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
