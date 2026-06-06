import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import api from '../services/api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'VOTER' | 'ADMIN';
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setTokens: (access: string, refresh: string, user: AuthUser) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredUser(): AuthUser | null {
  try {
    return JSON.parse(localStorage.getItem('user') ?? 'null') as AuthUser | null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem('accessToken'),
  );

  const setTokens = useCallback((access: string, refresh: string, u: AuthUser) => {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('user', JSON.stringify(u));
    setAccessToken(access);
    setUser(u);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{
      success: boolean;
      data: { accessToken: string; refreshToken: string; user: AuthUser };
    }>('/auth/login', { email, password });
    const { accessToken: access, refreshToken: refresh, user: u } = res.data.data;
    setTokens(access, refresh, u);
  }, [setTokens]);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // ignore errors on logout
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // Legacy key cleanup
    localStorage.removeItem('token');
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, login, logout, setTokens, isAdmin: user?.role === 'ADMIN' }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
