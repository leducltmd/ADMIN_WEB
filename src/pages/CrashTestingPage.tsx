import { useCallback, useEffect, useState } from 'react';

import { request } from '@/lib/api';
import { formatDateTime, formatRelativeTime } from '@/lib/format';
import type {
  CrashRequestStatus,
  CrashTestDevice,
  CrashTestRequest,
  CrashTestingStatus,
} from '@/lib/types';
import {
  AlertBanner,
  Badge,
  EmptyState,
  LoadingBlock,
  Modal,
} from '@/components/ui';
import {
  IconBolt,
  IconCheck,
  IconClock,
  IconCrash,
  IconDevice,
  IconExternal,
  IconRefresh,
} from '@/components/icons';
import { colors } from '@/theme/tokens';

/** Nhãn & màu của từng trạng thái yêu cầu crash. */
const STATUS_META: Record<
  CrashRequestStatus,
  { label: string; tone: 'success' | 'warning' | 'error' | 'neutral' | 'primary' }
> = {
  pending: { label: 'Pending', tone: 'warning' },
  triggered: { label: 'Crash Triggered', tone: 'primary' },
  reported: { label: 'Reported', tone: 'success' },
  failed: { label: 'Failed', tone: 'error' },
};

/** Trang Crash Testing — kích hoạt crash có chủ đích trên Flutter App. */
export function CrashTestingPage() {
  const [status, setStatus] = useState<CrashTestingStatus | null>(null);
  const [devices, setDevices] = useState<CrashTestDevice[]>([]);
  const [requests, setRequests] = useState<CrashTestRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const statusData = await request<CrashTestingStatus>(
        '/api/crash-testing/status',
      );
      setStatus(statusData);

      if (statusData.enabled) {
        const [deviceData, requestData] = await Promise.all([
          request<{ devices: CrashTestDevice[] }>('/api/crash-testing/devices'),
          request<{ requests: CrashTestRequest[] }>(
            '/api/crash-testing/requests',
          ),
        ]);
        setDevices(deviceData.devices);
        setRequests(requestData.requests);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không tải được dữ liệu crash test.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Tự động làm mới danh sách yêu cầu mỗi 5 giây để cập nhật trạng thái.
  useEffect(() => {
    if (!status?.enabled) return undefined;
    const timer = setInterval(() => {
      request<{ requests: CrashTestRequest[] }>('/api/crash-testing/requests')
        .then((data) => setRequests(data.requests))
        .catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, [status?.enabled]);

  const onlineDevices = devices.filter((device) => device.isOnline);

  const handleTrigger = async () => {
    setIsTriggering(true);
    setTriggerMessage(null);
    try {
      await request('/api/crash-testing/requests', {
        method: 'POST',
        body: {
          deviceId: selectedDeviceId || undefined,
          reason: reason.trim() || undefined,
        },
      });
      setIsConfirmOpen(false);
      setReason('');
      setTriggerMessage({
        tone: 'success',
        text:
          'Đã gửi yêu cầu crash. Trạng thái sẽ chuyển sang "Crash Triggered" khi ứng dụng nhận được lệnh.',
      });
      await load();
    } catch (err) {
      setTriggerMessage({
        tone: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Không gửi được yêu cầu crash test.',
      });
    } finally {
      setIsTriggering(false);
    }
  };

  if (isLoading && !status) {
    return <LoadingBlock label="Đang tải trạng thái Crash Testing..." />;
  }

  return (
    <div className="stack">
      {error ? (
        <AlertBanner tone="error" title="Không tải được dữ liệu">
          {error}
        </AlertBanner>
      ) : null}

      {triggerMessage ? (
        <AlertBanner tone={triggerMessage.tone === 'success' ? 'success' : 'error'}>
          {triggerMessage.text}
        </AlertBanner>
      ) : null}

      {status && !status.enabled ? (
        <AlertBanner tone="warning" title="Crash Testing đang tắt">
          {status.message}
          <div style={{ marginTop: 6, fontSize: 12.5 }}>
            Bật bằng cách đặt <code>CRASH_TESTING_ENABLED=true</code> trong file{' '}
            <code>.env</code> của backend và khởi động lại server. Tính năng luôn
            bị chặn ở môi trường <strong>production</strong>.
          </div>
        </AlertBanner>
      ) : null}

      {/* Khu vực Crash Testing */}
      <section className="crash-zone">
        <div className="crash-zone-header">
          <span className="crash-zone-icon">
            <IconCrash size={22} />
          </span>
          <div style={{ flex: 1 }}>
            <h3>Crash Testing</h3>
            <p>
              Kích hoạt crash có chủ đích trên Flutter App đang chạy để kiểm
              thử luồng ghi nhận lỗi của Firebase Crashlytics.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-danger"
            disabled={!status?.enabled}
            onClick={() => {
              setSelectedDeviceId('');
              setIsConfirmOpen(true);
            }}
          >
            <IconBolt size={16} />
            Test App Crash
          </button>
        </div>

        <AlertBanner tone="info" title="An toàn — chỉ dùng cho demo/testing">
          Yêu cầu này chỉ kích hoạt crash trên <strong>Flutter App</strong>.
          Admin Web và Backend TokenScope <strong>không bị ảnh hưởng</strong>.
          Tính năng bị chặn hoàn toàn ở môi trường production.
        </AlertBanner>

        {/* Hướng dẫn trạng thái */}
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h4>Pending</h4>
            <p>Admin bấm "Test App Crash" — yêu cầu được lưu và chờ app nhận.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h4>Crash Triggered</h4>
            <p>Flutter App nhận lệnh, ghi log Crashlytics và kích hoạt crash.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h4>Reported</h4>
            <p>
              Lỗi đã được gửi lên Firebase — kiểm tra tại Crashlytics Console.
            </p>
          </div>
        </div>

        <div className="detail-grid" style={{ marginTop: 16 }}>
          <div className="detail-item">
            <div className="label">Trạng thái tính năng</div>
            <div className="value">
              {status?.enabled ? (
                <Badge tone="success" dot>
                  Đang bật
                </Badge>
              ) : (
                <Badge tone="error" dot>
                  Đang tắt
                </Badge>
              )}
            </div>
          </div>
          <div className="detail-item">
            <div className="label">Môi trường</div>
            <div className="value" style={{ fontSize: 13.5 }}>
              {status?.environment ?? '—'}
            </div>
          </div>
          <div className="detail-item">
            <div className="label">Thiết bị đang hoạt động</div>
            <div className="value">
              {onlineDevices.length} / {devices.length}
            </div>
          </div>
          <div className="detail-item">
            <div className="label">Firebase Project</div>
            <div className="value" style={{ fontSize: 13.5 }}>
              {status?.projectId ?? '—'}
            </div>
          </div>
        </div>

        {status?.crashlyticsConsoleUrl ? (
          <div style={{ marginTop: 14 }}>
            <a
              href={status.crashlyticsConsoleUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
            >
              <IconExternal size={14} />
              Mở Firebase Crashlytics Console
            </a>
          </div>
        ) : null}
      </section>

      {/* Danh sách thiết bị */}
      <section className="card">
        <div className="card-header">
          <div>
            <h3>Thiết bị Flutter đang chạy</h3>
            <p>
              Ứng dụng đăng ký thiết bị khi khởi động. Chọn một thiết bị để gửi
              lệnh crash, hoặc để trống để gửi tới mọi thiết bị online.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => void load()}
            disabled={isLoading}
          >
            <IconRefresh size={14} />
            Làm mới
          </button>
        </div>

        {!status?.enabled ? (
          <EmptyState
            icon={<IconDevice size={22} />}
            title="Tính năng đang tắt"
            description="Bật CRASH_TESTING_ENABLED để xem danh sách thiết bị."
          />
        ) : devices.length === 0 ? (
          <EmptyState
            icon={<IconDevice size={22} />}
            title="Chưa có thiết bị nào"
            description="Hãy chạy ứng dụng Flutter để thiết bị tự đăng ký với backend."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Thiết bị</th>
                  <th>Nền tảng</th>
                  <th>Phiên bản</th>
                  <th>Người dùng</th>
                  <th>Hoạt động gần nhất</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device.deviceId}>
                    <td>
                      <div className="cell-user-info">
                        <strong>{device.deviceName ?? 'Thiết bị'}</strong>
                        <span className="mono">
                          {device.deviceId.slice(0, 18)}…
                        </span>
                      </div>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>
                      {device.platform ?? '—'}
                    </td>
                    <td>{device.appVersion ?? '—'}</td>
                    <td>
                      <div className="cell-user-info">
                        <strong>{device.userName ?? 'Chưa đăng nhập'}</strong>
                        <span>{device.userEmail ?? '—'}</span>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {formatRelativeTime(device.lastSeenAt)}
                    </td>
                    <td>
                      {device.isOnline ? (
                        <Badge tone="success" dot>
                          Online
                        </Badge>
                      ) : (
                        <Badge tone="neutral">Offline</Badge>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={!device.isOnline || !status?.enabled}
                        onClick={() => {
                          setSelectedDeviceId(device.deviceId);
                          setIsConfirmOpen(true);
                        }}
                      >
                        Gửi lệnh crash
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Lịch sử yêu cầu */}
      {status?.enabled ? (
        <section className="card">
          <div className="card-header">
            <div>
              <h3>Lịch sử yêu cầu crash</h3>
              <p>Theo dõi vòng đời Pending → Crash Triggered → Reported</p>
            </div>
          </div>

          {requests.length === 0 ? (
            <EmptyState
              icon={<IconCrash size={22} />}
              title="Chưa có yêu cầu nào"
              description="Các yêu cầu crash test sẽ xuất hiện tại đây."
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Thời điểm</th>
                    <th>Thiết bị</th>
                    <th>Người gửi</th>
                    <th>Lý do</th>
                    <th>Trạng thái</th>
                    <th>Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((item) => {
                    const meta = STATUS_META[item.status] ?? STATUS_META.pending;
                    return (
                      <tr key={item.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {formatDateTime(item.createdAt)}
                        </td>
                        <td>
                          {item.deviceName ?? (
                            <span style={{ color: colors.secondaryText }}>
                              Tất cả thiết bị
                            </span>
                          )}
                        </td>
                        <td>{item.requestedByName ?? 'Admin'}</td>
                        <td
                          style={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.reason ?? '—'}
                        </td>
                        <td>
                          <Badge tone={meta.tone} dot>
                            {meta.label}
                          </Badge>
                        </td>
                        <td
                          style={{
                            maxWidth: 240,
                            fontSize: 12,
                            color: colors.secondaryText,
                          }}
                        >
                          {item.result ?? '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {/* Hộp thoại xác nhận */}
      <Modal
        open={isConfirmOpen}
        title="Xác nhận kích hoạt crash"
        description="Thao tác này sẽ làm ứng dụng Flutter dừng ngay lập tức."
        icon={<IconCrash size={22} />}
        iconColor={colors.danger}
        iconBackground={colors.dangerLight}
        onClose={() => setIsConfirmOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isTriggering}
            >
              Huỷ bỏ
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => void handleTrigger()}
              disabled={isTriggering}
            >
              {isTriggering ? <span className="spinner" /> : <IconBolt size={15} />}
              {isTriggering ? 'Đang gửi...' : 'Kích hoạt crash'}
            </button>
          </>
        }
      >
        <div className="stack" style={{ gap: 16 }}>
          <AlertBanner tone="warning" title="Cảnh báo">
            Ứng dụng Flutter sẽ crash ngay lập tức và gửi lỗi lên Firebase
            Crashlytics. Chỉ thực hiện trên thiết bị demo/testing —{' '}
            <strong>không dùng trên bản production</strong>.
          </AlertBanner>

          <div className="field">
            <label htmlFor="device-select">Thiết bị nhận lệnh</label>
            <select
              id="device-select"
              className="select"
              value={selectedDeviceId}
              onChange={(event) => setSelectedDeviceId(event.target.value)}
            >
              <option value="">
                Tất cả thiết bị đang online ({onlineDevices.length})
              </option>
              {onlineDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.deviceName ?? device.deviceId}
                  {device.userName ? ` — ${device.userName}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="reason">Lý do / ghi chú (không bắt buộc)</label>
            <input
              id="reason"
              className="input"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ví dụ: Lab 3 — kiểm thử Crashlytics"
              maxLength={200}
            />
          </div>

          <div
            style={{
              fontSize: 12.5,
              color: colors.secondaryText,
              display: 'flex',
              flexDirection: 'column',
              gap: 7,
            }}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <IconClock size={14} />
              Yêu cầu được gửi ngay, ứng dụng nhận trong vòng 5 giây.
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <IconCheck size={14} />
              Trạng thái cập nhật tự động: Pending → Crash Triggered → Reported.
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <IconDevice size={14} />
              Admin Web và Backend không bị ảnh hưởng.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
