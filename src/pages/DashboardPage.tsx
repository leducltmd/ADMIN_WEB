import { useCallback, useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { request } from '@/lib/api';
import {
  formatCompact,
  formatCurrency,
  formatNumber,
  formatRelativeTime,
} from '@/lib/format';
import type {
  AdminOverview,
  AdminRange,
  AdminStats,
} from '@/lib/types';
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
  IconRefresh,
  IconToken,
  IconUsers,
} from '@/components/icons';
import { chartPalette, colors } from '@/theme/tokens';

const RANGE_OPTIONS: { value: AdminRange; label: string }[] = [
  { value: 'day', label: 'Hôm nay' },
  { value: 'week', label: '7 ngày' },
  { value: 'month', label: '30 ngày' },
];

/** Trang Dashboard — trang mặc định của Admin Web. */
export function DashboardPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [range, setRange] = useState<AdminRange>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overviewData, statsData] = await Promise.all([
        request<AdminOverview>('/api/admin/overview'),
        request<AdminStats>('/api/admin/stats', { query: { range } }),
      ]);
      setOverview(overviewData);
      setStats(statsData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không tải được dữ liệu tổng quan.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading && !overview) {
    return <LoadingBlock label="Đang tải dữ liệu tổng quan..." />;
  }

  if (error && !overview) {
    return (
      <AlertBanner tone="error" title="Không tải được dữ liệu">
        {error}
        <div style={{ marginTop: 10 }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => void load()}>
            <IconRefresh size={14} />
            Thử lại
          </button>
        </div>
      </AlertBanner>
    );
  }

  if (!overview || !stats) return null;

  const series = stats.series;

  // Dữ liệu phân bổ sự kiện tính năng (top 6).
  const featureData = stats.features
    .filter((f) => f.count > 0)
    .slice(0, 6)
    .map((f) => ({
      name: f.feature ?? f.eventName,
      value: f.count,
    }));

  const featureTotal = featureData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="stack">
      {/* Thẻ thống kê */}
      <section className="stat-grid">
        <StatCard
          label="Tổng số người dùng"
          value={formatNumber(overview.totalUsers)}
          icon={<IconUsers size={19} />}
          iconColor={colors.primary}
          iconBackground={colors.primaryLight}
          hint={
            <>
              <Badge tone="primary">+{overview.newUsersInRange}</Badge> mới trong khoảng
              này
            </>
          }
        />

        <StatCard
          label="Lượt sử dụng ứng dụng"
          value={formatNumber(overview.totalAppOpens)}
          icon={<IconActivity size={19} />}
          iconColor={colors.emerald}
          iconBackground="#ECFDF5"
          hint={`${formatNumber(overview.totalAppUsageEvents)} sự kiện tổng cộng`}
        />

        <StatCard
          label="Người dùng đang hoạt động"
          value={formatNumber(overview.activeUsers)}
          icon={<IconBolt size={19} />}
          iconColor={colors.warning}
          iconBackground={colors.warningLight}
          hint={`Hoạt động trong ${overview.activeWindowDays} ngày gần nhất`}
        />

        <StatCard
          label="Lượt sử dụng API AI"
          value={formatNumber(overview.totalAiApiCalls)}
          icon={<IconToken size={19} />}
          iconColor={colors.violet}
          iconBackground={colors.softPurple}
          hint={`${formatCompact(overview.totalTokens)} token · ${formatCurrency(overview.totalCost)}`}
        />
      </section>

      {/* Biểu đồ lượt sử dụng theo ngày/tuần/tháng */}
      <section className="card">
        <div className="card-header">
          <div>
            <h3>Biểu đồ thống kê lượt sử dụng</h3>
            <p>Theo dõi lượt mở ứng dụng và lượt gọi API AI theo thời gian</p>
          </div>
          <Segmented
            value={range}
            options={RANGE_OPTIONS}
            onChange={setRange}
          />
        </div>

        <div className="card-body">
          <div className="grid-2">
            <ChartFrame height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradOpens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.primary} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={colors.primary} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.emerald} stopOpacity={0.24} />
                      <stop offset="100%" stopColor={colors.emerald} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: colors.secondaryText }}
                    axisLine={{ stroke: colors.border }}
                    tickLine={false}
                    interval="preserveStartEnd"
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
                      boxShadow: '0 6px 18px rgba(15,23,42,0.10)',
                      fontSize: 12,
                    }}
                    labelStyle={{ fontWeight: 650, marginBottom: 4 }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Area
                    type="monotone"
                    dataKey="appOpens"
                    name="Lượt mở ứng dụng"
                    stroke={colors.primary}
                    strokeWidth={2}
                    fill="url(#gradOpens)"
                  />
                  <Area
                    type="monotone"
                    dataKey="aiApiCalls"
                    name="Lượt gọi API AI"
                    stroke={colors.emerald}
                    strokeWidth={2}
                    fill="url(#gradCalls)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartFrame>

            <ChartFrame height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={series}
                  margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: colors.secondaryText }}
                    axisLine={{ stroke: colors.border }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: colors.secondaryText }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(99,102,241,0.06)' }}
                    contentStyle={{
                      borderRadius: 10,
                      border: `1px solid ${colors.border}`,
                      boxShadow: '0 6px 18px rgba(15,23,42,0.10)',
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar
                    dataKey="appOpens"
                    name="Mở ứng dụng"
                    fill={colors.primary}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={22}
                  />
                  <Bar
                    dataKey="aiApiCalls"
                    name="Gọi API AI"
                    fill={colors.emerald}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={22}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          </div>
        </div>
      </section>

      {/* Phân bổ sự kiện + người dùng hoạt động */}
      <section className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Sự kiện sử dụng tính năng</h3>
              <p>Các hành động người dùng thực hiện trong ứng dụng</p>
            </div>
          </div>
          <div className="card-body">
            {featureData.length === 0 ? (
              <EmptyState
                icon={<IconChart size={22} />}
                title="Chưa có dữ liệu sự kiện"
                description="Dữ liệu sẽ xuất hiện khi người dùng tương tác với ứng dụng Flutter."
              />
            ) : (
              <ChartFrame height={260}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={featureData}
                      dataKey="value"
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
                      wrapperStyle={{ fontSize: 12 }}
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
              <h3>Người dùng hoạt động</h3>
              <p>Số người dùng hoạt động theo từng khoảng thời gian</p>
            </div>
          </div>
          <div className="card-body">
            <ChartFrame height={260}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={series}
                  margin={{ top: 8, right: 12, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: colors.secondaryText }}
                    axisLine={{ stroke: colors.border }}
                    tickLine={false}
                    interval="preserveStartEnd"
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
                  <Line
                    type="monotone"
                    dataKey="activeUsers"
                    name="Người dùng hoạt động"
                    stroke={colors.violet}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: colors.violet, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartFrame>
          </div>
        </div>
      </section>

      {/* Thống kê bổ sung */}
      <section className="grid-2-even">
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Tổng quan lượt gọi API AI</h3>
              <p>So sánh lượt mở ứng dụng với lượt gọi API trong khoảng đang chọn</p>
            </div>
          </div>
          <div className="card-body">
            <div className="detail-grid">
              <div className="detail-item">
                <div className="label">Lượt mở ứng dụng</div>
                <div className="value">{formatNumber(series.reduce((s, p) => s + p.appOpens, 0))}</div>
              </div>
              <div className="detail-item">
                <div className="label">Lượt gọi API AI</div>
                <div className="value">
                  {formatNumber(series.reduce((s, p) => s + p.aiApiCalls, 0))}
                </div>
              </div>
              <div className="detail-item">
                <div className="label">Token tiêu thụ</div>
                <div className="value">
                  {formatCompact(series.reduce((s, p) => s + p.tokens, 0))}
                </div>
              </div>
              <div className="detail-item">
                <div className="label">Chi phí ước tính</div>
                <div className="value">
                  {formatCurrency(series.reduce((s, p) => s + p.cost, 0), 4)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3>Tình trạng hệ thống</h3>
              <p>Thông tin tổng quan của nền tảng</p>
            </div>
          </div>
          <div className="card-body">
            <div className="detail-grid">
              <div className="detail-item">
                <div className="label">Lượt gọi thất bại</div>
                <div className="value" style={{ color: colors.danger }}>
                  {formatNumber(overview.failedApiCalls)}
                </div>
              </div>
              <div className="detail-item">
                <div className="label">Tỷ lệ thành công</div>
                <div className="value" style={{ color: colors.success }}>
                  {overview.totalAiApiCalls > 0
                    ? `${(
                        ((overview.totalAiApiCalls - overview.failedApiCalls) /
                          overview.totalAiApiCalls) *
                        100
                      ).toFixed(1)}%`
                    : '—'}
                </div>
              </div>
              <div className="detail-item">
                <div className="label">Người dùng mới</div>
                <div className="value">+{overview.newUsersInRange}</div>
              </div>
              <div className="detail-item">
                <div className="label">Cập nhật lần cuối</div>
                <div className="value" style={{ fontSize: 13 }}>
                  {formatRelativeTime(overview.generatedAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {featureTotal > 0 ? (
        <section className="card">
          <div className="card-header">
            <div>
              <h3>Bảng chi tiết sự kiện tính năng</h3>
              <p>{formatNumber(featureTotal)} lượt sử dụng tính năng được ghi nhận</p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tính năng</th>
                  <th>Sự kiện</th>
                  <th style={{ textAlign: 'right' }}>Số lượt</th>
                  <th style={{ textAlign: 'right' }}>Tỷ lệ</th>
                </tr>
              </thead>
              <tbody>
                {stats.features.map((feature) => (
                  <tr key={`${feature.eventName}-${feature.feature ?? ''}`}>
                    <td style={{ fontWeight: 600 }}>
                      {feature.feature ?? feature.eventName}
                    </td>
                    <td>
                      <Badge tone="neutral">{feature.eventName}</Badge>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {formatNumber(feature.count)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {featureTotal > 0
                        ? `${((feature.count / featureTotal) * 100).toFixed(1)}%`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
