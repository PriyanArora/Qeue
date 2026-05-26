import { createContext, useContext, useMemo, useState } from 'react';
import type { AuthResponse, UserRole } from '../services/types';

export interface AuthUser {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  accessToken: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (response: AuthResponse) => void;
  logout: () => void;
}

const AUTH_STORAGE_KEY = 'qeue.auth';
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  const value = useMemo<AuthContextValue>(() => ({
    user,
    login(response) {
      const nextUser: AuthUser = {
        userId: response.userId,
        email: response.email,
        displayName: response.displayName,
        role: response.role,
        accessToken: response.accessToken
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
    },
    logout() {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
    }
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}
