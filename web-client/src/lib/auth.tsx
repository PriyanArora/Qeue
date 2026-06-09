import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, authApi, getToken, setToken } from './api';
import type { Role, User } from './types';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isOrganizer: boolean;
  isAttendee: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: {
    email: string;
    password: string;
    displayName: string;
    role: Role;
  }) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, if a token is present, hydrate the user from /api/auth/me.
  useEffect(() => {
    const controller = new AbortController();
    if (!getToken()) {
      setLoading(false);
      return;
    }
    authApi
      .me(controller.signal)
      .then(setUser)
      .catch((err: unknown) => {
        // Ignore aborts (StrictMode double-mount / unmount) so a cancelled
        // request never clears a still-valid token. Only drop the token when
        // the server actively rejects it as unauthorized.
        if (controller.signal.aborted || (err as Error)?.name === 'AbortError') return;
        if (err instanceof ApiError && err.status === 401) setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setToken(res.accessToken);
    const u: User = {
      userId: res.userId,
      email: res.email,
      displayName: res.displayName,
      role: res.role,
    };
    setUser(u);
    return u;
  }, []);

  const register = useCallback(
    async (input: { email: string; password: string; displayName: string; role: Role }) => {
      const res = await authApi.register(input);
      setToken(res.accessToken);
      const u: User = {
        userId: res.userId,
        email: res.email,
        displayName: res.displayName,
        role: res.role,
      };
      setUser(u);
      return u;
    },
    [],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isOrganizer: user?.role === 'ORGANIZER',
      isAttendee: user?.role === 'ATTENDEE',
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
