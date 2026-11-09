/**
 * Bảng màu của Admin Web — bám sát bảng màu trong Flutter app
 * (`lib/core/theme/app_colors.dart`) để hai nền tảng trông như một sản phẩm.
 */
export const colors = {
  primary: '#6366F1',
  primaryDark: '#4338CA',
  navy: '#111827',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  secondaryText: '#475569',
  border: '#E5E7EB',
  success: '#16A34A',
  warning: '#D97706',
  softPurple: '#F5F3FF',
  violet: '#8B5CF6',
  azure: '#3B82F6',
  live: '#12B76A',
  liveLight: '#E7F8F0',
  emerald: '#10B981',
  tangerine: '#F59E0B',
  error: '#DC2626',
  danger: '#BA1A1A',
  dangerLight: '#FFDAD6',
  indigoSoft: '#F1F3FF',
  indigoTrack: '#E1E8FD',
  aqua: '#57DFFE',
  grape: '#8455EF',
  indigo: '#4648D4',
  primaryLight: '#EEF2FF',
  primaryBorder: '#C7D2FE',
  successLight: '#F0FDF4',
  warningLight: '#FFFBEB',
  errorLight: '#FEF2F2',
  disabled: '#CBD5E1',
  onPrimary: '#FFFFFF',
} as const;

/** Bảng màu biểu đồ — dùng thứ tự ổn định để các series dễ phân biệt. */
export const chartPalette = [
  colors.primary,
  colors.emerald,
  colors.tangerine,
  colors.violet,
  colors.azure,
  colors.grape,
] as const;

/** Khoảng cách chuẩn — tương ứng `lib/core/theme/app_spacing.dart`. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Bán kính bo góc. */
export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 999,
} as const;

/** Đổ bóng cho thẻ — tinh tế, không quá nặng. */
export const shadow = {
  card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
  raised: '0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
  danger: '0 4px 6px -1px rgba(186, 26, 26, 0.10), 0 2px 4px -2px rgba(186, 26, 26, 0.06)',
} as const;
