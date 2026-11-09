# TokenScope Admin Web

Trang quản trị web cho nền tảng **TokenScope** — theo dõi người dùng, lượt sử
dụng ứng dụng, kích hoạt crash có chủ đích để kiểm thử Firebase Crashlytics
và xem số liệu Firebase Analytics.

> Ứng dụng Flutter (`FE_tokenScope`) và backend (`BE_tokenScope`) **không bị
> thay đổi kiến trúc**. Admin Web chỉ tiêu thụ API của backend hiện có.

## Công nghệ

- React 18 + TypeScript + Vite 6
- React Router 6 — định tuyến client-side
- Recharts — biểu đồ (Area, Bar, Line, Pie)
- Không dùng framework UI nào — style thuần theo bảng màu TokenScope

## Chạy dự án

```bash
# 1. Khởi động backend TokenScope (thư mục BE_tokenScope)
npm run dev

# 2. Khởi động Admin Web (thư mục này)
npm install
npm run dev
```

Mặc định Admin Web chạy ở <http://localhost:5173> và gọi backend tại
`http://localhost:3000`.

### Cấu hình biến môi trường

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:3000` | Địa chỉ backend TokenScope |
| `VITE_ADMIN_PORT` | `5173` | Cổng dev server |

Tạo file `.env.local` nếu cần ghi đè:

```env
VITE_API_BASE_URL=http://192.168.1.10:3000
```

## Tài khoản quản trị viên

Quyền Admin được xác định theo 2 nguồn (ưu tiên theo thứ tự):

1. `User.role = 'admin'` trong database — nguồn chuẩn.
2. Email nằm trong biến môi trường `ADMIN_EMAILS` của backend — fallback cho
   môi trường demo/lab.

```bash
# Trong .env của backend
ADMIN_EMAILS="demo@tokenscope.io"
```

Tài khoản mẫu: `demo@tokenscope.io` / `123456`.

## Cấu trúc mã nguồn

```
src/
├── components/       # UI dùng chung (StatCard, Modal, Badge...) + icon SVG
├── contexts/         # AuthContext — quản lý phiên đăng nhập
├── layouts/          # AdminLayout — sidebar + header
├── lib/              # API client, kiểu dữ liệu, hàm định dạng
├── pages/            # Dashboard, Users, Analytics, Crash Testing, Login
├── styles/           # global.css — thiết kế TokenScope
└── theme/            # tokens.ts — bảng màu, spacing, shadow
```

## Các trang

| Trang | Đường dẫn | Nội dung |
| --- | --- | --- |
| Dashboard | `/` | Thẻ thống kê, biểu đồ ngày/tuần/tháng, phân bổ sự kiện |
| Quản lý lượt sử dụng | `/users` | Bảng người dùng, tìm kiếm, phân trang, chi tiết lịch sử |
| Firebase Analytics | `/analytics` | Số liệu GA4: app open, phiên, sự kiện tính năng |
| Crash Testing | `/crash-testing` | Kích hoạt crash có chủ đích, theo dõi thiết bị & trạng thái |

## Crash Testing — luồng hoạt động

```
Admin Web                     Backend                  Flutter App
    │                            │                         │
    │ POST /crash-testing/requests                        │
    ├───────────────────────────►│                         │
    │                            │  status = pending       │
    │                            │                         │
    │                            │◄──── GET /poll ────────┤ (mỗi 5s)
    │                            │  status = triggered     │
    │                            │                         │ FirebaseCrashlytics
    │                            │                         │ .recordError() +
    │                            │                         │ .crash()
    │                            │◄── POST /report ────────┤ status = reported
    │                            │                         │
    │  GET /requests (poll 5s)  │                         │
    │◄───────────────────────────┤                         │
```

Trạng thái: **Pending → Crash Triggered → Reported** (hoặc **Failed**).

### An toàn

- Tính năng bị **tắt hoàn toàn** ở môi trường `production` — kể cả khi
  `CRASH_TESTING_ENABLED=true`.
- Chỉ crash trên **Flutter App**. Admin Web và Backend không bị ảnh hưởng.
- Backend từ chối mọi endpoint crash testing khi tính năng tắt (`403`).

```bash
# Trong .env của backend
CRASH_TESTING_ENABLED="true"
CRASH_TESTING_ENVIRONMENTS="development,staging,test,demo"
```

## Nguồn dữ liệu thật

Toàn bộ số liệu trong Admin Web đọc trực tiếp từ SQL Server của TokenScope
— không có dữ liệu giả lập.

| Endpoint | Nguồn trong database |
| --- | --- |
| `GET /api/admin/overview` | `User`, `UsageRecord`, `AppUsageEvent` |
| `GET /api/admin/stats` | `AppUsageEvent` + `UsageRecord` theo ngày/tuần/tháng |
| `GET /api/admin/users` | `User` + số liệu gom nhóm từ `UsageRecord`/`AppUsageEvent` |
| `GET /api/admin/users/:id` | Lịch sử `AppUsageEvent` + `UsageRecord` của user |
| `GET /api/crash-testing/*` | `CrashTestDevice`, `CrashTestRequest` |
| `GET /api/admin/analytics/firebase` | GA4 Data API (nếu đã cấu hình) |

### Sự kiện sử dụng ứng dụng

Flutter App ghi nhận sự kiện qua `POST /api/app-usage/events`:

| `eventName` | Ý nghĩa |
| --- | --- |
| `app_open` | Lượt mở ứng dụng |
| `screen_view` | Người dùng xem một màn hình |
| `feature_usage` | Người dùng dùng một tính năng (kèm `feature`) |
| `app_pause` / `app_resume` / `app_close` | Vòng đời app |

Vì app khởi động **trước khi đăng nhập**, sự kiện `app_open` đầu tiên được
ghi với `userId = null`. Sau khi đăng nhập, app gọi `POST /api/app-usage/claim`
để backend gắn `userId` vào **chính bản ghi cũ** — số lượt mở ứng dụng không
bị tính trùng và "người dùng đang hoạt động" chính xác.

## Firebase Analytics

Backend đọc GA4 Data API bằng service account (không thêm dependency
`googleapis` — ký JWT bằng `node:crypto` rồi gọi REST API).

```bash
# Trong .env của backend
FIREBASE_ANALYTICS_PROPERTY_ID="properties/123456789"
FIREBASE_ANALYTICS_CREDENTIALS="<nội dung JSON service account>"
```

Chưa cấu hình thì trang Analytics hiển thị hướng dẫn thay vì báo lỗi.

> **Firebase Analytics** theo dõi *hành vi & lượt sử dụng*.
> **Firebase Crashlytics** theo dõi *lỗi & sự cố* — không có API đọc số liệu
> công khai, dữ liệu được xem trực tiếp trên Firebase Console.

## Lệnh

```bash
npm run dev        # dev server
npm run build      # build production (tsc + vite build)
npm run preview    # xem bản build
npm run typecheck  # kiểm tra kiểu
```
