import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { request } from '@/lib/api';
import {
  eventLabel,
  formatCompact,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatRelativeTime,
} from '@/lib/format';
import type {
  AdminUserDetailResult,
  AdminUserList,
} from '@/lib/types';
import {
  AlertBanner,
  Avatar,
  Badge,
  ChartFrame,
  EmptyState,
  LoadingBlock,
  Modal,
} from '@/components/ui';
import {
  IconActivity,
  IconArrowLeft,
  IconArrowRight,
  IconRefresh,
  IconSearch,
  IconUsers,
} from '@/components/icons';
import { colors } from '@/theme/tokens';

const PAGE_SIZE = 12;

/** Trang quản lý lượt sử dụng — danh sách người dùng + chi tiết. */
export function UsersPage() {
  const [data, setData] = useState<AdminUserList | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Debounce ô tìm kiếm để không gọi API liên tục khi gõ.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setOffset(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await request<AdminUserList>('/api/admin/users', {
        query: {
          search: debouncedSearch || undefined,
          status,
          offset,
          limit: PAGE_SIZE,
        },
      });
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không tải được danh sách người dùng.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, status, offset]);

  useEffect(() => {
    void load();
  }, [load]);

  const total = data?.total ?? 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div className="stack">
      {/* Bộ lọc */}
      <section className="card">
        <div className="card-body tight" style={{ paddingTop: 16, paddingBottom: 16 }}>
          <div className="toolbar">
            <div className="search-box">
              <span className="search-icon">
                <IconSearch size={15} />
              </span>
              <input
                className="input"
                placeholder="Tìm theo tên, email hoặc ID..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Tìm kiếm người dùng"
              />
            </div>

            <select
              className="select"
              style={{ width: 170 }}
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as 'all' | 'active' | 'inactive');
                setOffset(0);
              }}
              aria-label="Lọc theo trạng thái"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void load()}
              disabled={isLoading}
            >
              <IconRefresh size={15} />
              Làm mới
            </button>

            <span
              style={{
                marginLeft: 'auto',
                fontSize: 13,
                color: colors.secondaryText,
              }}
            >
              {formatNumber(total)} người dùng
            </span>
          </div>
        </div>
      </section>

      {error ? (
        <AlertBanner tone="error" title="Không tải được danh sách">
          {error}
        </AlertBanner>
      ) : null}

      {/* Bảng người dùng */}
      <section className="card">
        <div className="card-header">
          <div>
            <h3>Danh sách người dùng</h3>
            <p>Thông tin đăng ký, lượt sử dụng ứng dụng và trạng thái hoạt động</p>
          </div>
        </div>

        {isLoading && !data ? (
          <LoadingBlock />
        ) : !data || data.users.length === 0 ? (
          <EmptyState
            icon={<IconUsers size={22} />}
            title="Không tìm thấy người dùng"
            description={
              debouncedSearch
                ? `Không có kết quả cho "${debouncedSearch}". Thử từ khoá khác.`
                : 'Chưa có người dùng nào trong hệ thống.'
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>ID</th>
                    <th>Ngày đăng ký</th>
                    <th style={{ textAlign: 'right' }}>Lượt sử dụng app</th>
                    <th style={{ textAlign: 'right' }}>Lượt gọi API AI</th>
                    <th style={{ textAlign: 'right' }}>Token</th>
                    <th>Trạng thái</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="cell-user">
                          <Avatar name={user.name} size="sm" />
                          <div className="cell-user-info">
                            <strong>{user.name}</strong>
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="mono" title={user.id}>
                          {user.id.slice(0, 8)}…
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {formatDate(user.createdAt)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatNumber(user.appOpenCount)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatNumber(user.aiApiCalls)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {formatCompact(user.totalTokens)}
                      </td>
                      <td>
                        {user.isAdmin ? (
                          <Badge tone="primary">Admin</Badge>
                        ) : user.isCurrentlyActive ? (
                          <Badge tone="success" dot>
                            Đang hoạt động
                          </Badge>
                        ) : user.isActive ? (
                          <Badge tone="neutral">Không hoạt động</Badge>
                        ) : (
                          <Badge tone="error" dot>
                            Đã vô hiệu hoá
                          </Badge>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedUserId(user.id)}
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span>
                Hiển thị {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} trong{' '}
                {formatNumber(total)} người dùng
              </span>
              <div className="pagination-controls">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={offset === 0 || isLoading}
                  onClick={() => setOffset(Math.max(offset - PAGE_SIZE, 0))}
                >
                  <IconArrowLeft size={14} />
                  Trước
                </button>
                <span style={{ padding: '0 6px' }}>
                  Trang {currentPage}/{totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={offset + PAGE_SIZE >= total || isLoading}
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                >
                  Sau
                  <IconArrowRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {selectedUserId ? (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      ) : null}
    </div>
  );
}

/** Hộp thoại chi tiết lịch sử sử dụng của một người dùng. */
function UserDetailModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<AdminUserDetailResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    request<AdminUserDetailResult>(`/api/admin/users/${userId}`)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Không tải được chi tiết người dùng.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const user = data?.user;

  return (
    <Modal
      open
      size="lg"
      title="Chi tiết lịch sử sử dụng"
      description="Toàn bộ hoạt động của người dùng trên nền tảng TokenScope"
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Đóng
        </button>
      }
    >
      {isLoading ? (
        <LoadingBlock label="Đang tải chi tiết..." />
      ) : error ? (
        <AlertBanner tone="error">{error}</AlertBanner>
      ) : !user ? null : (
        <div className="stack" style={{ gap: 20 }}>
          {/* Thông tin cơ bản */}
          <div className="row" style={{ gap: 14 }}>
            <Avatar name={user.name} size="lg" />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="row" style={{ gap: 8 }}>
                <strong style={{ fontSize: 16 }}>{user.name}</strong>
                {user.isAdmin ? <Badge tone="primary">Admin</Badge> : null}
                {user.isCurrentlyActive ? (
                  <Badge tone="success" dot>
                    Đang hoạt động
                  </Badge>
                ) : null}
              </div>
              <div style={{ fontSize: 13, color: colors.secondaryText }}>
                {user.email}
              </div>
              <div className="mono" style={{ marginTop: 2 }}>
                {user.id}
              </div>
            </div>
          </div>

          {/* Số liệu */}
          <div className="detail-grid">
            <div className="detail-item">
              <div className="label">Ngày đăng ký</div>
              <div className="value" style={{ fontSize: 13.5 }}>
                {formatDate(user.createdAt)}
              </div>
            </div>
            <div className="detail-item">
              <div className="label">Đăng nhập gần nhất</div>
              <div className="value" style={{ fontSize: 13.5 }}>
                {formatRelativeTime(user.lastLoginAt)}
              </div>
            </div>
            <div className="detail-item">
              <div className="label">Lượt mở ứng dụng</div>
              <div className="value">{formatNumber(user.appOpenCount)}</div>
            </div>
            <div className="detail-item">
              <div className="label">Lượt gọi API AI</div>
              <div className="value">{formatNumber(user.aiApiCalls)}</div>
            </div>
            <div className="detail-item">
              <div className="label">Token tiêu thụ</div>
              <div className="value">{formatCompact(user.totalTokens)}</div>
            </div>
            <div className="detail-item">
              <div className="label">Chi phí</div>
              <div className="value">{formatCurrency(user.totalCost, 4)}</div>
            </div>
            <div className="detail-item">
              <div className="label">Dự án / Nhà cung cấp</div>
              <div className="value" style={{ fontSize: 13.5 }}>
                {user.projectCount} / {user.providerCount}
              </div>
            </div>
            <div className="detail-item">
              <div className="label">Phiên đăng nhập</div>
              <div className="value">{formatNumber(user.sessionCount)}</div>
            </div>
          </div>

          {/* Biểu đồ 14 ngày */}
          {data.daily.length > 0 ? (
            <div>
              <h4
                style={{
                  margin: '0 0 10px',
                  fontSize: 14,
                  fontWeight: 650,
                }}
              >
                Hoạt động 14 ngày gần nhất
              </h4>
              <ChartFrame height={200}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.daily}
                    margin={{ top: 4, right: 4, left: -22, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#EEF2F6"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value: string) => value.slice(5)}
                      tick={{ fontSize: 10, fill: colors.secondaryText }}
                      axisLine={{ stroke: colors.border }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: colors.secondaryText }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: `1px solid ${colors.border}`,
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="appOpens"
                      name="Mở ứng dụng"
                      fill={colors.primary}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={18}
                    />
                    <Bar
                      dataKey="aiApiCalls"
                      name="Gọi API AI"
                      fill={colors.emerald}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartFrame>
            </div>
          ) : null}

          {/* Lịch sử gọi API AI */}
          <div>
            <h4
              style={{
                margin: '0 0 10px',
                fontSize: 14,
                fontWeight: 650,
              }}
            >
              Lịch sử gọi API AI
            </h4>
            {user.usageHistory.length === 0 ? (
              <EmptyState
                icon={<IconActivity size={20} />}
                title="Chưa có lượt gọi API"
                description="Người dùng này chưa gọi API AI nào."
              />
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Thời điểm</th>
                      <th>Nhà cung cấp</th>
                      <th>Model</th>
                      <th style={{ textAlign: 'right' }}>Token</th>
                      <th style={{ textAlign: 'right' }}>Chi phí</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.usageHistory.map((record) => (
                      <tr key={record.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {formatDateTime(record.occurredAt)}
                        </td>
                        <td>{record.provider}</td>
                        <td>
                          <span className="mono">{record.model}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {formatNumber(record.totalTokens)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {formatCurrency(record.cost, 4)}
                        </td>
                        <td>
                          {record.isSuccess ? (
                            <Badge tone="success" dot>
                              Thành công
                            </Badge>
                          ) : (
                            <Badge tone="error" dot>
                              {record.statusCode}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sự kiện sử dụng ứng dụng */}
          <div>
            <h4
              style={{
                margin: '0 0 10px',
                fontSize: 14,
                fontWeight: 650,
              }}
            >
              Sự kiện sử dụng ứng dụng
            </h4>
            {user.recentAppEvents.length === 0 ? (
              <EmptyState
                icon={<IconActivity size={20} />}
                title="Chưa có sự kiện"
                description="Ứng dụng chưa ghi nhận hoạt động nào từ người dùng này."
              />
            ) : (
              <div className="timeline">
                {user.recentAppEvents.map((event) => (
                  <div className="timeline-item" key={event.id}>
                    <span className="timeline-dot" />
                    <div className="timeline-body">
                      <div className="timeline-title">
                        {eventLabel(event.eventName)}
                        {event.feature ? (
                          <span
                            style={{
                              marginLeft: 8,
                              fontSize: 12,
                              color: colors.secondaryText,
                              fontWeight: 500,
                            }}
                          >
                            {event.feature}
                          </span>
                        ) : null}
                      </div>
                      <div className="timeline-meta">
                        {formatDateTime(event.occurredAt)}
                        {event.screen ? ` · ${event.screen}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
