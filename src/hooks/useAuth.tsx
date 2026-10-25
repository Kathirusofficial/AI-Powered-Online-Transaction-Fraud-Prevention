import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
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

export function getCleanToken(): string | null {
  try {
    const raw = localStorage.getItem('fraudshield_token');
    if (!raw) return null;
    const clean = raw.trim().replace(/^["']+|["']+$/g, '');
    if (!clean || clean === 'undefined' || clean === 'null') {
      localStorage.removeItem('fraudshield_token');
      return null;
    }
    return clean;
  } catch {
    return null;
  }
}

// Request Interceptor: dynamically attach valid JWT to every outgoing request
axios.interceptors.request.use(
  (config) => {
    const token = getCleanToken();
    if (token) {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: catch 401 unauthorized errors and invalidate stale session
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const msg = error.response.data?.msg || '';
      if (typeof msg === 'string' && (msg.includes('Token is not valid') || msg.includes('authorization denied') || msg.includes('User account not found') || msg.includes('jwt'))) {
        localStorage.removeItem('fraudshield_token');
        localStorage.removeItem('fraudshield_user');
        window.dispatchEvent(new CustomEvent('fraudshield:session_expired'));
      }
    }
    return Promise.reject(error);
  }
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('fraudshield_user');
      const token = getCleanToken();
      if (saved && token && saved !== 'undefined' && saved !== 'null') {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.id || parsed._id)) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse user from local storage', e);
    }
    localStorage.removeItem('fraudshield_user');
    localStorage.removeItem('fraudshield_token');
    delete axios.defaults.headers.common['Authorization'];
    return null;
  });

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
    };
    window.addEventListener('fraudshield:session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('fraudshield:session_expired', handleSessionExpired);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token, user } = res.data;
      const cleanToken = (token || '').trim().replace(/^["']+|["']+$/g, '');
      localStorage.setItem('fraudshield_token', cleanToken);
      localStorage.setItem('fraudshield_user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${cleanToken}`;
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
      const cleanToken = (token || '').trim().replace(/^["']+|["']+$/g, '');
      localStorage.setItem('fraudshield_token', cleanToken);
      localStorage.setItem('fraudshield_user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${cleanToken}`;
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
