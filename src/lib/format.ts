/** Các hàm định dạng dùng chung trong Admin Web. */

/** Định dạng số lớn: 1.2K, 3.4M. */
export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString('vi-VN');
}

/** Định dạng số có dấu phân cách nghìn. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString('vi-VN');
}

/** Định dạng tiền USD. */
export function formatCurrency(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '$0.00';
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/** Định dạng ngày giờ kiểu Việt Nam. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Định dạng ngày kiểu Việt Nam. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Khoảng thời gian tương đối — "3 phút trước". */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';

  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return 'vừa xong';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} phút trước`;
  if (diffSeconds < 86_400) return `${Math.floor(diffSeconds / 3600)} giờ trước`;
  if (diffSeconds < 2_592_000) return `${Math.floor(diffSeconds / 86_400)} ngày trước`;
  return formatDate(iso);
}

/** Viết hoa chữ cái đầu. */
export function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Chuyển tên sự kiện sang nhãn tiếng Việt thân thiện. */
export function eventLabel(eventName: string): string {
  const labels: Record<string, string> = {
    app_open: 'Mở ứng dụng',
    app_close: 'Đóng ứng dụng',
    app_pause: 'Ứng dụng vào nền',
    app_resume: 'Ứng dụng trở lại',
    feature_usage: 'Dùng tính năng',
    screen_view: 'Xem màn hình',
    session_start: 'Bắt đầu phiên',
    session_end: 'Kết thúc phiên',
    login: 'Đăng nhập',
    logout: 'Đăng xuất',
    connect_provider: 'Kết nối nhà cung cấp',
    view_usage_history: 'Xem lịch sử sử dụng',
    view_usage_detail: 'Xem chi tiết lượt gọi',
    export_report: 'Xuất báo cáo',
    update_budget: 'Cập nhật ngân sách',
  };
  return labels[eventName] ?? capitalize(eventName.replace(/_/g, ' '));
}

/** Lấy chữ cái đầu của tên để hiển thị trong avatar. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[parts.length - 2].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}
