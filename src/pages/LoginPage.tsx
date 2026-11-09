import { useState, type FormEvent } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { AlertBanner } from '@/components/ui';
import { colors } from '@/theme/tokens';

/** Trang đăng nhập Admin Web. */
export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await login(email.trim(), password);
    if (!result.success) {
      setError(result.message ?? 'Đăng nhập thất bại.');
      setIsSubmitting(false);
    }
    // Khi thành công, AuthProvider sẽ điều hướng sang Dashboard.
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="sidebar-logo">T</span>
          <div>
            <h1 className="login-title">TokenScope Admin</h1>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: colors.secondaryText,
              }}
            >
              Quản trị & giám sát nền tảng
            </p>
          </div>
        </div>

        <p className="login-subtitle">
          Đăng nhập bằng tài khoản quản trị viên để truy cập Dashboard.
        </p>

        {error ? (
          <div style={{ marginBottom: 16 }}>
            <AlertBanner tone="error">{error}</AlertBanner>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="stack" style={{ gap: 14 }}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@tokenscope.io"
              autoComplete="username"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 4 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? <span className="spinner" /> : null}
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p
          style={{
            marginTop: 20,
            marginBottom: 0,
            fontSize: 12,
            color: colors.secondaryText,
            textAlign: 'center',
          }}
        >
          Chỉ tài khoản có vai trò <strong>admin</strong> mới truy cập được.
        </p>
      </div>
    </div>
  );
}
