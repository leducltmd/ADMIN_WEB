import type { ReactNode } from 'react';

import { colors, radius } from '@/theme/tokens';
import { initials } from '@/lib/format';

/** Thẻ thống kê — dùng trên Dashboard. */
export function StatCard({
  label,
  value,
  hint,
  icon,
  iconColor = colors.primary,
  iconBackground = colors.primaryLight,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  icon: ReactNode;
  iconColor?: string;
  iconBackground?: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        <span
          className="stat-icon"
          style={{ color: iconColor, background: iconBackground }}
        >
          {icon}
        </span>
      </div>
      <div className="stat-value">{value}</div>
      {hint ? <div className="stat-hint">{hint}</div> : null}
    </div>
  );
}

/** Avatar dựa trên chữ cái đầu. */
export function Avatar({
  name,
  size = 'md',
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <span
      className={`avatar ${size === 'md' ? '' : size}`}
      title={name}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

/** Nhãn trạng thái. */
export function Badge({
  children,
  tone = 'neutral',
  dot = false,
}: {
  children: ReactNode;
  tone?: 'success' | 'warning' | 'error' | 'neutral' | 'primary';
  dot?: boolean;
}) {
  return (
    <span className={`badge badge-${tone}`}>
      {dot ? <span className="dot" /> : null}
      {children}
    </span>
  );
}

/** Hộp thoại xác nhận. */
export function Modal({
  open,
  title,
  description,
  icon,
  iconColor = colors.primary,
  iconBackground = colors.primaryLight,
  children,
  footer,
  size = 'md',
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  icon?: ReactNode;
  iconColor?: string;
  iconBackground?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={`modal ${size === 'lg' ? 'lg' : ''}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          {icon ? (
            <span
              className="modal-icon"
              style={{ color: iconColor, background: iconBackground }}
            >
              {icon}
            </span>
          ) : null}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3>{title}</h3>
            {description ? <p>{description}</p> : null}
          </div>
        </div>
        {children ? <div className="modal-body">{children}</div> : null}
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

/** Trạng thái rỗng. */
export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h4>{title}</h4>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

/** Đang tải. */
export function LoadingBlock({ label }: { label?: string }) {
  return (
    <div className="loading-block" style={{ gap: 12, flexDirection: 'column' }}>
      <span className="spinner lg" />
      {label ? (
        <span style={{ color: colors.secondaryText, fontSize: 13 }}>
          {label}
        </span>
      ) : null}
    </div>
  );
}

/** Thông báo trạng thái. */
export function AlertBanner({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className={`alert-banner ${tone}`}>
      <div>
        {title ? <strong>{title}</strong> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}

/** Nhóm nút chuyển trạng thái (ngày / tuần / tháng). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="segmented" role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          className={option.value === value ? 'active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Vùng bo tròn cho biểu đồ. */
export function ChartFrame({
  height = 280,
  children,
}: {
  height?: number;
  children: ReactNode;
}) {
  return (
    <div style={{ width: '100%', height, borderRadius: radius.md }}>
      {children}
    </div>
  );
}
