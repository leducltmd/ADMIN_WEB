/** Các kiểu dữ liệu dùng chung với backend TokenScope. */

/** Khoảng thống kê. */
export type AdminRange = 'day' | 'week' | 'month';

/** Tổng quan Dashboard. */
export interface AdminOverview {
  totalUsers: number;
  activeUsers: number;
  newUsersInRange: number;
  totalAppOpens: number;
  totalAppUsageEvents: number;
  totalAiApiCalls: number;
  totalTokens: number;
  totalCost: number;
  failedApiCalls: number;
  activeWindowDays: number;
  crashlyticsProjectId: string;
  generatedAt: string;
}

/** Một điểm trên biểu đồ thống kê. */
export interface TimeSeriesPoint {
  date: string;
  label: string;
  appOpens: number;
  appEvents: number;
  aiApiCalls: number;
  tokens: number;
  cost: number;
  activeUsers: number;
}

/** Một nhóm sự kiện tính năng. */
export interface FeatureEvent {
  eventName: string;
  feature: string | null;
  count: number;
  lastOccurredAt: string;
}

/** Kết quả `GET /api/admin/stats`. */
export interface AdminStats {
  range: AdminRange;
  series: TimeSeriesPoint[];
  features: FeatureEvent[];
}

/** Một dòng trong bảng người dùng. */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isVerified: boolean;
  isActive: boolean;
  isAdmin: boolean;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
  appOpenCount: number;
  usageCount: number;
  aiApiCalls: number;
  totalTokens: number;
  totalCost: number;
  isCurrentlyActive: boolean;
}

/** Kết quả `GET /api/admin/users`. */
export interface AdminUserList {
  users: AdminUser[];
  total: number;
  offset: number;
  limit: number;
}

/** Sự kiện sử dụng ứng dụng của một người dùng. */
export interface UserAppEvent {
  id: string;
  eventName: string;
  feature: string | null;
  screen: string | null;
  occurredAt: string;
}

/** Bản ghi lượt gọi API AI. */
export interface UserUsageRecord {
  id: string;
  model: string;
  provider: string;
  providerType: string;
  totalTokens: number;
  cost: number;
  isSuccess: boolean;
  statusCode: number;
  occurredAt: string;
}

/** Chi tiết người dùng. */
export interface AdminUserDetail extends AdminUser {
  birthDate: string | null;
  projectCount: number;
  providerCount: number;
  sessionCount: number;
  budgetCount: number;
  recentAppEvents: UserAppEvent[];
  usageHistory: UserUsageRecord[];
}

/** Kết quả `GET /api/admin/users/:id`. */
export interface AdminUserDetailResult {
  user: AdminUserDetail;
  daily: {
    date: string;
    appOpens: number;
    aiApiCalls: number;
    tokens: number;
  }[];
}

/** Tóm tắt Firebase Analytics. */
export interface FirebaseAnalyticsSummary {
  propertyId: string;
  rangeStartDate: string;
  rangeEndDate: string;
  appOpens: number;
  activeUsers: number;
  sessions: number;
  totalEvents: number;
  newUsers: number;
  sessionsPerUser: number;
  featureEvents: {
    name: string;
    count: number;
    users: number;
  }[];
}

/** Kết quả `GET /api/admin/analytics/firebase`. */
export interface FirebaseAnalyticsResult {
  configured: boolean;
  message?: string;
  data?: FirebaseAnalyticsSummary;
}

/** Chuỗi thời gian Firebase Analytics. */
export interface FirebaseAnalyticsTimeSeries {
  configured: boolean;
  message?: string;
  data?: {
    date: string;
    users: number;
    sessions: number;
    events: number;
  }[];
}

/** Thông tin Crashlytics. */
export interface CrashlyticsStatus {
  projectId: string;
  consoleUrl: string;
  note: string;
}

/** Kết quả `GET /api/admin/analytics/firebase`. */
export interface FirebaseAnalyticsPayload {
  summary: FirebaseAnalyticsResult;
  timeSeries: FirebaseAnalyticsTimeSeries;
  crashlytics: CrashlyticsStatus;
}

/** Trạng thái tính năng crash testing. */
export interface CrashTestingStatus {
  enabled: boolean;
  environment: string;
  allowedEnvironments: string[];
  projectId: string;
  crashlyticsConsoleUrl: string;
  message: string;
}

/** Thiết bị Flutter đã đăng ký. */
export interface CrashTestDevice {
  deviceId: string;
  deviceName: string | null;
  platform: string | null;
  appVersion: string | null;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  isOnline: boolean;
  lastSeenAt: string;
  createdAt: string;
}

/** Trạng thái yêu cầu crash test. */
export type CrashRequestStatus = 'pending' | 'triggered' | 'reported' | 'failed';

/** Yêu cầu crash test. */
export interface CrashTestRequest {
  id: string;
  deviceId: string | null;
  deviceName: string | null;
  requestedBy: string | null;
  requestedByName: string | null;
  status: CrashRequestStatus;
  reason: string | null;
  result: string | null;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
  triggeredAt: string | null;
  reportedAt: string | null;
}

/** Thông tin người dùng đăng nhập. */
export interface AdminProfile {
  id: string;
  email: string;
  name: string;
  birthDate: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  role: string;
  createdAt: string;
}
