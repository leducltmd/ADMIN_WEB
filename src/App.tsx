import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/layouts/AdminLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { UsersPage } from '@/pages/UsersPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { CrashTestingPage } from '@/pages/CrashTestingPage';
import { LoadingBlock } from '@/components/ui';

/** Chuyển hướng về trang đăng nhập nếu chưa đăng nhập. */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingBlock label="Đang kiểm tra phiên đăng nhập..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/** Điều hướng người đã đăng nhập ra khỏi trang login. */
function RedirectIfAuthenticated() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingBlock />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <LoginPage />;
}

/** Định tuyến của Admin Web. */
export function AppRoutes() {
  useEffect(() => {
    document.title = 'TokenScope Admin';
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<RedirectIfAuthenticated />} />
      <Route
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        {/* Dashboard là trang mặc định */}
        <Route index element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/crash-testing" element={<CrashTestingPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
