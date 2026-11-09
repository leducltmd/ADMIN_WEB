/** Địa chỉ backend TokenScope. */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

/** Lỗi API kèm mã lỗi từ backend. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Token hết hạn hoặc không hợp lệ. */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** Không có quyền admin. */
  get isForbidden(): boolean {
    return this.status === 403;
  }
}

/** Khóa lưu access token. */
const TOKEN_KEY = 'tokenscope.admin.accessToken';
const REFRESH_TOKEN_KEY = 'tokenscope.admin.refreshToken';

/** Lưu access token. */
export function setAccessToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

/** Đọc access token hiện tại. */
export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** Lưu refresh token. */
export function setRefreshToken(token: string | null): void {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

/** Đọc refresh token hiện tại. */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/** Xoá toàn bộ phiên đăng nhập. */
export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/** Gọi một endpoint của backend TokenScope. */
export async function request<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
    query?: Record<string, string | number | undefined | null>;
    /** Bỏ qua việc tự refresh token (dùng cho chính endpoint refresh). */
    skipRefresh?: boolean;
  } = {},
): Promise<T> {
  const { method = 'GET', body, query, skipRefresh } = options;

  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const payload = (data ?? {}) as { message?: string; code?: string };

    // Access token hết hạn → thử làm mới một lần rồi gọi lại.
    if (response.status === 401 && !skipRefresh) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        return request<T>(path, { ...options, skipRefresh: true });
      }
      clearSession();
    }

    throw new ApiError(
      payload.message ?? 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
      response.status,
      payload.code,
    );
  }

  return data as T;
}

/** Thử làm mới access token bằng refresh token. */
async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearSession();
      return false;
    }

    const data = (await response.json()) as { accessToken?: string };
    if (!data.accessToken) {
      clearSession();
      return false;
    }

    setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}
