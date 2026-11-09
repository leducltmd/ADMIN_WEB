import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  clearSession,
  getAccessToken,
  request,
  setAccessToken,
  setRefreshToken,
} from '@/lib/api';
import type { AdminProfile } from '@/lib/types';

/** Kết quả đăng nhập. */
interface LoginResult {
  success: boolean;
  message?: string;
}

interface AuthContextValue {
  profile: AdminProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Người dùng có quyền admin hay không. */
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Cung cấp trạng thái đăng nhập cho toàn bộ Admin Web. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Tải thông tin người dùng hiện tại (dùng khi F5 hoặc khôi phục phiên). */
  const loadProfile = useCallback(async () => {
    if (!getAccessToken()) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await request<{ user: AdminProfile }>('/api/auth/me');
      setProfile(data.user);
    } catch {
      clearSession();
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      try {
        const data = await request<{
          user: AdminProfile;
          accessToken: string;
          refreshToken: string;
        }>('/api/auth/login', {
          method: 'POST',
          body: { email, password },
          skipRefresh: true,
        });

        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        setProfile(data.user);

        // Kiểm tra quyền admin ngay sau khi đăng nhập.
        if (data.user.role !== 'admin') {
          try {
            await request('/api/admin/overview');
          } catch {
            throw new Error(
              'Tài khoản này không có quyền quản trị viên. Vui lòng liên hệ chủ dự án.',
            );
          }
        }

        return { success: true };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Đăng nhập thất bại.';
        clearSession();
        setProfile(null);
        return { success: false, message };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await request('/api/auth/logout', { method: 'POST', body: {} });
    } catch {
      // Vẫn xoá phiên cục bộ dù backend lỗi.
    }
    clearSession();
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      isLoading,
      isAuthenticated: Boolean(profile),
      isAdmin: profile?.role === 'admin',
      login,
      logout,
    }),
    [profile, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook truy cập trạng thái đăng nhập. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được dùng bên trong AuthProvider.');
  }
  return context;
}
