import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui';
import {
  IconChart,
  IconCrash,
  IconDashboard,
  IconLogout,
  IconMenu,
  IconUsers,
} from '@/components/icons';
import { colors } from '@/theme/tokens';

/** Định nghĩa các mục trong sidebar. */
const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/users', label: 'Quản lý lượt sử dụng', icon: IconUsers, end: false },
  { to: '/analytics', label: 'Firebase Analytics', icon: IconChart, end: false },
];

const DANGER_ITEMS = [
  { to: '/crash-testing', label: 'Crash Testing', icon: IconCrash, end: false },
];

/** Tiêu đề trang hiện tại — hiển thị trên header. */
const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Tổng quan Dashboard',
    subtitle: 'Theo dõi người dùng & lượt sử dụng của TokenScope',
  },
  '/users': {
    title: 'Quản lý lượt sử dụng',
    subtitle: 'Danh sách người dùng và lịch sử sử dụng của họ',
  },
  '/analytics': {
    title: 'Firebase Analytics',
    subtitle: 'Hành vi người dùng & sự kiện tính năng',
  },
  '/crash-testing': {
    title: 'Crash Testing',
    subtitle: 'Kích hoạt crash có chủ đích để kiểm thử Crashlytics',
  },
};

/** Khung ứng dụng: sidebar + header + nội dung. */
export function AdminLayout() {
  const { profile, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Đóng sidebar khi điều hướng (quan trọng trên tablet/mobile).
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const page = PAGE_TITLES[location.pathname] ?? {
    title: 'TokenScope Admin',
    subtitle: '',
  };

  return (
    <div className="app-shell">
      {isSidebarOpen ? (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-logo">T</span>
          <div className="sidebar-brand-text">
            <h1>TokenScope</h1>
            <p>Admin Web</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Tổng quan</div>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="icon">
                <item.icon size={17} />
              </span>
              {item.label}
            </NavLink>
          ))}

          <div className="sidebar-section-label">Kiểm thử</div>
          {DANGER_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-link danger ${isActive ? 'active' : ''}`
              }
            >
              <span className="icon">
                <item.icon size={17} />
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <Avatar name={profile?.name ?? 'Admin'} size="sm" />
            <div className="sidebar-user-info">
              <strong>{profile?.name ?? 'Quản trị viên'}</strong>
              <span>{profile?.email ?? ''}</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ width: '100%' }}
            onClick={() => void logout()}
          >
            <IconLogout size={15} />
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <div className="row" style={{ gap: 12 }}>
            <button
              type="button"
              className="menu-toggle"
              onClick={() => setIsSidebarOpen((open) => !open)}
              aria-label="Mở menu"
            >
              <IconMenu size={18} />
            </button>
            <div>
              <h2>{page.title}</h2>
              {page.subtitle ? <p>{page.subtitle}</p> : null}
            </div>
          </div>

          <div className="header-actions">
            <span
              className="badge badge-primary"
              style={{ background: colors.indigoSoft, color: colors.primaryDark }}
            >
              <span className="dot" />
              Quản trị viên
            </span>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
