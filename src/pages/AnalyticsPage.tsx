import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { request } from '@/lib/api';
import { formatCompact, formatNumber } from '@/lib/format';
import type { FirebaseAnalyticsPayload } from '@/lib/types';
import {
  AlertBanner,
  Badge,
  ChartFrame,
  EmptyState,
  LoadingBlock,
  Segmented,
  StatCard,
} from '@/components/ui';
import {
  IconActivity,
  IconBolt,
  IconChart,
  IconExternal,
  IconRefresh,
  IconUsers,
} from '@/components/icons';
import { chartPalette, colors } from '@/theme/tokens';

const RANGE_OPTIONS = [
  { value: '7', label: '7 ngày' },
  { value: '30', label: '30 ngày' },
  { value: '90', label: '90 ngày' },
];

/**
 * Trang Firebase Analytics.
 *
 * Phân biệt rõ hai dịch vụ:
 * - **Firebase Analytics** — theo dõi *hành vi & lượt sử dụng* (trang này).
 * - **Firebase Crashlytics** — theo dõi *lỗi & sự cố* (mục Crash Testing).
 */
export function AnalyticsPage() {
  const [days, setDays] = useState('30');
  const [data, setData] = useState<FirebaseAnalyticsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await request<FirebaseAnalyticsPayload>(
        '/api/admin/analytics/firebase',
        { query: { days } },
      );
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không tải được dữ liệu Firebase Analytics.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading && !data) {
    return <LoadingBlock label="Đang đọc dữ liệu Firebase Analytics..." />;
  }

  const summary = data?.summary.data;
  const isConfigured = data?.summary.configured ?? false;
  const timeSeries = data?.timeSeries.data ?? [];

  const featureData = (summary?.featureEvents ?? []).slice(0, 8);
  const featureTotal = featureData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="stack">
      {error ? (
        <AlertBanner tone="error" title="Không tải được dữ liệu">
          {error}
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => void load()}
            >
              <IconRefresh size={14} />
              Thử lại
            </button>
          </div>
        </AlertBanner>
      ) : null}

      {/* Phân biệt Analytics vs Crashlytics */}
      <section className="grid-2-even">
        <AlertBanner tone="info" title="Firebase Analytics — hành vi & lượt sử dụng">
          Theo dõi số lượt mở ứng dụng, người dùng hoạt động, phiên sử dụng và
          các sự kiện tính năng. Nguồn dữ liệu: GA4 Data API.
        </AlertBanner>
        <AlertBanner tone="warning" title="Firebase Crashlytics — lỗi & sự cố">
          Theo dõi lỗi và sự cố của ứng dụng. Crashlytics không có API đọc số
          liệu công khai — dữ liệu được xem trực tiếp trên Firebase Console.
        </AlertBanner>
      </section>

      {!isConfigured ? (
        <section className="card">
          <div className="card-body">
            <EmptyState
              icon={<IconChart size={22} />}
              title="Firebase Analytics chưa được cấu hình"
              description={
                data?.summary.message ??
                'Thiết lập FIREBASE_ANALYTICS_PROPERTY_ID và FIREBASE_ANALYTICS_CREDENTIALS trong file .env của backend.'
              }
            />
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E5E7EB',
                borderRadius: 10,
                padding: 16,
                fontSize: 12.5,
                color: colors.secondaryText,
                lineHeight: 1.9,
              }}
            >
              <strong style={{ color: colors.navy }}>Cách cấu hình:</strong>
              <br />
              1. Tạo service account trong Google Cloud Console và tải file
              JSON.
              <br />
              2. Cấp quyền <strong>Viewer</strong> cho service account trên GA4
              property.
              <br />
              3. Thêm vào <code>.env</code> của backend:
              <br />
              <code>FIREBASE_ANALYTICS_PROPERTY_ID=properties/123456789</code>
              <br />
              <code>FIREBASE_ANALYTICS_CREDENTIALS=&lt;nội dung JSON&gt;</code>
            </div>
          </div>
        </section>
      ) : summary ? (
        <>
          {/* Thẻ thống kê */}
          <section className="stat-grid">
            <StatCard
              label="Số lượt mở ứng dụng"
              value={formatNumber(summary.appOpens)}
              icon={<IconActivity size={19} />}
              iconColor={colors.primary}
              iconBackground={colors.primaryLight}
              hint={`${summary.rangeStartDate} → ${summary.rangeEndDate}`}
            />
            <StatCard
              label="Người dùng hoạt động"
              value={formatNumber(summary.activeUsers)}
              icon={<IconUsers size={19} />}
              iconColor={colors.emerald}
              iconBackground="#ECFDF5"
              hint={`+${formatNumber(summary.newUsers)} người dùng mới`}
            />
            <StatCard
              label="Số phiên sử dụng"
              value={formatNumber(summary.sessions)}
              icon={<IconBolt size={19} />}
              iconColor={colors.warning}
              iconBackground={colors.warningLight}
              hint={`${summary.sessionsPerUser} phiên / người dùng`}
            />
            <StatCard
              label="Tổng số sự kiện"
              value={formatCompact(summary.totalEvents)}
              icon={<IconChart size={19} />}
              iconColor={colors.violet}
              iconBackground={colors.softPurple}
              hint={`Property: ${summary.propertyId}`}
            />
          </section>

          {/* Biểu đồ chuỗi thời gian */}
          {timeSeries.length > 0 ? (
            <section className="card">
              <div className="card-header">
                <div>
                  <h3>Lượt sử dụng theo ngày</h3>
                  <p>Người dùng hoạt động, phiên sử dụng và sự kiện từ GA4</p>
                </div>
                <Segmented
                  value={days}
                  options={RANGE_OPTIONS}
                  onChange={setDays}
                />
              </div>
              <div className="card-body">
                <ChartFrame height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={timeSeries}
                      margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#EEF2F6"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value: string) => value.slice(5)}
                        tick={{ fontSize: 11, fill: colors.secondaryText }}
                        axisLine={{ stroke: colors.border }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: colors.secondaryText }}
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
                      <Legend
                        wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                        iconType="circle"
                        iconSize={8}
                      />
                      <Bar
                        dataKey="users"
                        name="Người dùng hoạt động"
                        fill={colors.primary}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={20}
                      />
                      <Bar
                        dataKey="sessions"
                        name="Phiên sử dụng"
                        fill={colors.emerald}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={20}
                      />
                      <Bar
                        dataKey="events"
                        name="Sự kiện"
                        fill={colors.tangerine}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartFrame>
              </div>
            </section>
          ) : null}

          {/* Sự kiện tính năng */}
          <section className="grid-2">
            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Sự kiện sử dụng tính năng</h3>
                  <p>Các sự kiện được ghi nhận trên Firebase Analytics</p>
                </div>
              </div>
              <div className="card-body">
                {featureData.length === 0 ? (
                  <EmptyState
                    icon={<IconChart size={22} />}
                    title="Chưa có sự kiện"
                    description="Chưa ghi nhận được sự kiện nào trong khoảng thời gian này."
                  />
                ) : (
                  <ChartFrame height={280}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={featureData}
                          dataKey="count"
                          nameKey="name"
                          innerRadius={58}
                          outerRadius={92}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {featureData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={chartPalette[index % chartPalette.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: 10,
                            border: `1px solid ${colors.border}`,
                            fontSize: 12,
                          }}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: 11.5 }}
                          iconType="circle"
                          iconSize={8}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartFrame>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Chi tiết sự kiện</h3>
                  <p>{formatNumber(featureTotal)} lượt sự kiện được ghi nhận</p>
                </div>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tên sự kiện</th>
                      <th style={{ textAlign: 'right' }}>Số lượt</th>
                      <th style={{ textAlign: 'right' }}>Người dùng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureData.map((event) => (
                      <tr key={event.name}>
                        <td>
                          <span className="mono">{event.name}</span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatNumber(event.count)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {formatNumber(event.users)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      ) : null}

      {/* Liên kết Crashlytics Console */}
      {data?.crashlytics ? (
        <section className="card">
          <div className="card-body">
            <div className="row-between">
              <div>
                <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                  <strong style={{ fontSize: 14.5 }}>
                    Firebase Crashlytics — theo dõi lỗi & sự cố
                  </strong>
                  <Badge tone="warning">Crashlytics</Badge>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: colors.secondaryText,
                    maxWidth: 640,
                  }}
                >
                  {data.crashlytics.note} Dùng mục <strong>Crash Testing</strong>{' '}
                  trong Admin Web để kích hoạt crash có chủ đích và kiểm chứng
                  luồng báo cáo.
                </p>
              </div>
              <a
                href={data.crashlytics.consoleUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
              >
                <IconExternal size={15} />
                Mở Crashlytics Console
              </a>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
