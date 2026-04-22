# Mobile App UI/UX Flow — HD-FARMS

**Date:** 2026-04-21 | **Stack:** Expo (React Native) | **Users:** Worker · Manager · Vet

---

## Navigation Structure

**Bottom Tab Bar** — QR nổi bật ở giữa:

```
┌──────────────────────────────┐
│                              │
│          Content             │
│                              │
├──────────────────────────────┤
│  🏠    🏠    📷    🔔    ☰  │
│ Home  Zones [QR] Alerts More │
└──────────────────────────────┘
```

- `📷 [QR]` là nút lồi (FAB-style), to hơn các tab khác
- Tất cả roles đều thấy cùng tabs — quyền filter nội dung bên trong

---

## Screen 1 — Home (`/home`)

**Worker view** — tập trung việc cần làm hôm nay:

```
┌──────────────────────────────┐
│  Xin chào, Minh 👋    21/04  │
│  Khu A · Công nhân           │
├──────────────────────────────┤
│                              │
│  ⚠️ Cần làm hôm nay (5)      │
│  ┌──────────────────────┐    │
│  │ 💉 Heo #A-012        │    │
│  │    Tiêm FMD — quá hạn│    │
│  │    [Ghi ngay →]      │    │
│  ├──────────────────────┤    │
│  │ 💉 Heo #A-034        │    │
│  │    Tiêm FMD — hôm nay│    │
│  │    [Ghi ngay →]      │    │
│  ├──────────────────────┤    │
│  │  Xem tất cả 5 mục →  │    │
│  └──────────────────────┘    │
│                              │
│  📋 Nhập nhanh               │
│  ┌──────┐ ┌──────┐ ┌──────┐ │
│  │  ⚖️  │ │  💉  │ │  🍽️  │ │
│  │ Cân  │ │Vaccine│ │ Ăn  │ │
│  └──────┘ └──────┘ └──────┘ │
│                              │
│  Khu A hôm nay               │
│  420 con · 2 bệnh · 3 tiêm  │
└──────────────────────────────┘
│  🏠    🏠    📷    🔔    ☰  │
└──────────────────────────────┘
```

**Manager view** — cùng màn hình, thêm section tổng quan farm:

```
  ...phần worker...

│  📊 Tổng quan farm           │
│  ┌──────────┬──────────┐     │
│  │  5,234   │   42     │     │
│  │  Tổng    │  Bệnh    │     │
│  ├──────────┼──────────┤     │
│  │    7     │   18     │     │
│  │  Lứa     │ Tiêm hôm │     │
│  └──────────┴──────────┘     │
```

---

## Screen 2 — QR Scanner (`/scan`)

```
┌──────────────────────────────┐
│  ✕          Quét QR          │
├──────────────────────────────┤
│                              │
│  ┌──────────────────────┐    │
│  │                      │    │
│  │   [Camera viewfinder]│    │
│  │        ┌────┐        │    │
│  │        │    │        │    │
│  │        │    │        │    │
│  │        └────┘        │    │
│  │   Hướng camera vào   │    │
│  │     mã QR con vật    │    │
│  └──────────────────────┘    │
│                              │
│  ─────── hoặc ───────        │
│                              │
│  [🔍 Tìm theo số hiệu]       │
│                              │
│  Quét gần đây:               │
│  · Heo #A-003  —  5 phút trước│
│  · Heo #A-012  — 20 phút trước│
└──────────────────────────────┘
│  🏠    🏠    📷    🔔    ☰  │
└──────────────────────────────┘
```

**Sau khi quét thành công** → Bottom sheet trượt lên (không navigate):

```
┌──────────────────────────────┐
│  [Camera mờ phía sau]        │
│                              │
│  ┌──────────────────────┐    │
│  │ ▔▔▔▔▔▔▔▔            │    │
│  │ HEO #A-003  🔴 Bệnh  │    │
│  │ Khu A · Lứa L2024-03 │    │
│  │ 68 kg · 5 ngày trước │    │
│  │                      │    │
│  │ Thao tác nhanh:      │    │
│  │ ┌────┐┌────┐┌────┐   │    │
│  │ │ ⚖️ ││ 💉 ││ 🤒 │   │    │
│  │ │Cân ││Vắc-││Bệnh│   │    │
│  │ └────┘└────┘└────┘   │    │
│  │ ┌────┐┌────┐         │    │
│  │ │ 🍽️ ││ 🔄 │         │    │
│  │ │ Ăn ││Status        │    │
│  │ └────┘└────┘         │    │
│  │                      │    │
│  │  [Xem đầy đủ thông tin →] │
│  └──────────────────────┘    │
└──────────────────────────────┘
```

> Workflow chính: **Scan → Bottom sheet → Tap action → Form → Submit → Quay lại scan**

---

## Screen 3 — Animal Detail (`/animals/[id]`)

Truy cập qua: scan QR → "Xem đầy đủ" hoặc từ danh sách zone.

```
┌──────────────────────────────┐
│  ←   HEO #A-003              │
├──────────────────────────────┤
│                              │
│  ┌──────┐  HEO #A-003        │
│  │ [QR] │  🔴 ĐANG BỆNH      │
│  └──────┘  Khu A · L2024-03  │
│            Nhập: 15/08/2024  │
│                              │
│  ┌────────┬────────┬────────┐ │
│  │ 68 kg  │25/04 💉│FMD 3/7 │ │
│  │ Cân gần│ Tiêm tới│Điều trị│ │
│  └────────┴────────┴────────┘ │
│                              │
│  [Sức khỏe][Vaccine][Bệnh][Ăn]│
│  ──── (tab: Sức khỏe) ──────  │
│                              │
│  📈 Cân nặng                  │
│  ┌──────────────────────┐    │
│  │  kg                  │    │
│  │  80│          __--   │    │
│  │  60│     __--‾       │    │
│  │  40│__--‾            │    │
│  │    └──────────── ng  │    │
│  └──────────────────────┘    │
│                              │
│  Lịch sử cân                 │
│  · 20/04 — 68 kg             │
│  · 13/04 — 65 kg  (+3kg/tuần)│
│  · 06/04 — 62 kg             │
│                              │
│  [+ Ghi cân nặng mới]        │
└──────────────────────────────┘
│  🏠    🏠    📷    🔔    ☰  │
└──────────────────────────────┘
```

---

## Screen 4 — Quick Input Forms

Thiết kế theo nguyên tắc: **tối đa 3 field bắt buộc, submit 1 chạm**.

### 4a. Ghi Cân Nặng

```
┌──────────────────────────────┐
│  ✕     Ghi cân — #A-003      │
├──────────────────────────────┤
│                              │
│  Cân nặng (kg) *             │
│  ┌──────────────────────┐    │
│  │         68           │    │  ← số keyboard mở ngay
│  └──────────────────────┘    │
│  Lần trước: 65 kg (7 ngày)   │
│                              │
│  Ngày ghi *                  │
│  ┌──────────────────────┐    │
│  │  21/04/2026  [hôm nay]    │
│  └──────────────────────┘    │
│                              │
│  Ghi chú (tuỳ chọn)          │
│  ┌──────────────────────┐    │
│  │                      │    │
│  └──────────────────────┘    │
│                              │
│  ┌──────────────────────┐    │
│  │      ✅ LƯU          │    │  ← full-width, prominent
│  └──────────────────────┘    │
└──────────────────────────────┘
```

### 4b. Ghi Tiêm Vaccine

```
┌──────────────────────────────┐
│  ✕   Ghi tiêm — #A-003       │
├──────────────────────────────┤
│                              │
│  Loại vaccine *              │
│  ┌──────────────────────┐    │
│  │  FMD               ▼ │    │
│  └──────────────────────┘    │
│  Lần tiếp theo: +180 ngày    │
│                              │
│  Ngày tiêm *                 │
│  [ 21/04/2026  ✓ hôm nay ]   │
│                              │
│  Số lô vaccine               │
│  ┌──────────────────────┐    │
│  │ VN-FMD-2024-001      │    │
│  └──────────────────────┘    │
│                              │
│  ┌──────────────────────┐    │
│  │      ✅ LƯU          │    │
│  └──────────────────────┘    │
└──────────────────────────────┘
```

### 4c. Ghi Bệnh (Bác sĩ thú y)

```
┌──────────────────────────────┐
│  ✕   Ghi bệnh — #A-003       │
├──────────────────────────────┤
│                              │
│  Loại bệnh *                 │
│  ┌──────────────────────┐    │
│  │  Lở mồm long móng  ▼ │    │
│  └──────────────────────┘    │
│                              │
│  Mức độ *                    │
│  [Nhẹ]  [● Vừa]  [Nặng]     │  ← toggle buttons
│                              │
│  Triệu chứng                 │
│  ┌──────────────────────┐    │
│  │ sốt, loét miệng...   │    │
│  └──────────────────────┘    │
│                              │
│  Đổi trạng thái con vật      │
│  [Khỏe] [Theo dõi] [● Bệnh]  │
│                              │
│  ┌──────────────────────┐    │
│  │      ✅ LƯU          │    │
│  └──────────────────────┘    │
└──────────────────────────────┘
```

### 4d. Ghi Thức Ăn

```
┌──────────────────────────────┐
│  ✕   Ghi thức ăn — #A-003    │
├──────────────────────────────┤
│                              │
│  Loại thức ăn *              │
│  ┌──────────────────────┐    │
│  │  Cám hỗn hợp CP     ▼│    │
│  └──────────────────────┘    │
│                              │
│  Lượng (kg) *                │
│  ┌──────────────────────┐    │
│  │         2.5          │    │
│  └──────────────────────┘    │
│  TB 7 ngày: 2.3 kg/ngày      │
│                              │
│  ┌──────────────────────┐    │
│  │      ✅ LƯU          │    │
│  └──────────────────────┘    │
└──────────────────────────────┘
```

---

## Screen 5 — Zones (`/zones`)

```
┌──────────────────────────────┐
│  Khu nuôi              🔍    │
├──────────────────────────────┤
│                              │
│  ┌──────────────────────┐    │
│  │ Khu A · Heo thịt     │    │
│  │ 420/500 con  ▓▓▓▓▓░  │    │
│  │ ✅ 416  ⚠️ 2  🔴 2   │    │
│  └──────────────────────┘    │
│  ┌──────────────────────┐    │
│  │ Khu B · Heo nái      │    │
│  │ 380/400 con  ▓▓▓▓▓▓▓▓│    │
│  │ ✅ 380  ⚠️ 0  🔴 0   │    │
│  └──────────────────────┘    │
│  ┌──────────────────────┐    │
│  │ Khu C · Bò           │    │
│  │ 280/300 con  ▓▓▓▓▓▓░  │    │
│  │ ✅ 278  ⚠️ 1  🔴 1   │    │
│  └──────────────────────┘    │
└──────────────────────────────┘
│  🏠    🏠    📷    🔔    ☰  │
└──────────────────────────────┘
```

**Tap vào zone** → Danh sách animals trong zone đó:

```
┌──────────────────────────────┐
│  ← Khu A · 420 con      🔍  │
├──────────────────────────────┤
│  Lọc: [Tất cả▼] [Trạng thái▼]│
├──────────────────────────────┤
│  #A-001  Heo  ✅ Khỏe  82kg  │
│  #A-002  Heo  ⚠️ Theo dõi    │
│  #A-003  Heo  🔴 Bệnh  68kg  │
│  #A-004  Heo  ✅ Khỏe  79kg  │
│  ...                         │
└──────────────────────────────┘
│  🏠    🏠    📷    🔔    ☰  │
└──────────────────────────────┘
```

---

## Screen 6 — Alerts (`/alerts`)

```
┌──────────────────────────────┐
│  Thông báo              [⚙️] │
├──────────────────────────────┤
│  [Hôm nay (8)] [Tuần này (24)]│
├──────────────────────────────┤
│                              │
│  🔴 QUÁ HẠN                  │
│  ┌──────────────────────┐    │
│  │ 💉 Heo #A-012        │    │
│  │ Tiêm FMD — quá 2 ngày│    │
│  │ Khu A                │    │
│  │ [Scan QR]  [Xem] →   │    │
│  └──────────────────────┘    │
│                              │
│  🟡 HÔM NAY                  │
│  ┌──────────────────────┐    │
│  │ 💉 Heo #A-034        │    │
│  │ Tiêm FMD — hôm nay   │    │
│  │ [Scan QR]  [Xem] →   │    │
│  └──────────────────────┘    │
│  ┌──────────────────────┐    │
│  │ 💉 Bò #C-034         │    │
│  │ Tiêm LSD — hôm nay   │    │
│  │ [Scan QR]  [Xem] →   │    │
│  └──────────────────────┘    │
│                              │
│  🔵 NGÀY MAI                 │
│  ┌──────────────────────┐    │
│  │ 💉 5 con cần tiêm... │    │
│  │ [Xem tất cả →]       │    │
│  └──────────────────────┘    │
└──────────────────────────────┘
│  🏠    🏠    📷    🔔    ☰  │
└──────────────────────────────┘
```

**"Scan QR" button trên alert** → mở scanner thẳng, sau khi scan đúng con đó thì auto-open form tiêm vaccine.

---

## Screen 7 — More / Profile (`/more`)

Khác nhau theo role:

```
┌──────────────────────────────┐
│  Nguyễn Văn Minh             │
│  Công nhân · Khu A           │
├──────────────────────────────┤
│                              │
│  [Worker & Manager]          │
│  📋 Lứa nuôi đang theo dõi   │
│  📊 Báo cáo cân nặng         │
│                              │
│  [Manager only]              │
│  📈 Dashboard tổng farm      │
│  👥 Quản lý tài khoản        │
│  🏠 Quản lý khu nuôi         │
│                              │
│  [Vet only]                  │
│  🔬 Lịch sử điều trị         │
│  💊 Danh mục thuốc & vaccine │
│                              │
│  ──────────────────────      │
│  ⚙️  Cài đặt app             │
│  🚪 Đăng xuất                │
└──────────────────────────────┘
│  🏠    🏠    📷    🔔    ☰  │
└──────────────────────────────┘
```

---

## Core User Flows

### Flow 1: Worker nhập cân hàng ngày
```
Mở app
  → Home: thấy "3 con cần cân hôm nay"
  → Tap [📷 Scan]
  → Quét QR chuồng #A-003
  → Bottom sheet: tap [⚖️ Cân]
  → Nhập 68 kg → [✅ LƯU]
  → "Đã lưu ✓" toast
  → Tự quay lại camera → quét con tiếp theo
```

### Flow 2: Vet ghi bệnh
```
Scan QR
  → Bottom sheet: tap [🤒 Bệnh]
  → Chọn loại bệnh + mức độ + triệu chứng
  → Đổi status → Bệnh
  → [✅ LƯU]
  → Xem Animal Detail → tab Bệnh án
  → Tap [+ Thêm điều trị]
  → Nhập thuốc + liều lượng
```

### Flow 3: Manager kiểm tra cuối ngày
```
Home → xem tổng quan khu
  → Tap Alerts → review 5 mục chưa xử lý
  → Tap Zones → kiểm tra Khu A có 2 bệnh
  → Tap vào #A-003 → xem tiến triển bệnh
  → Xem tab Sức khỏe → biểu đồ cân nặng
```

### Flow 4: Tiêm vaccine theo alert
```
Alerts tab → thấy "Heo #A-012 tiêm FMD hôm nay"
  → Tap [Scan QR]
  → Scanner mở, quét QR con #A-012
  → Nhận diện đúng → auto-open form Tiêm vaccine
  → Vaccine đã pre-fill: FMD
  → Nhập số lô → [✅ LƯU]
  → Alert biến mất khỏi list
```

---

## UX Principles Mobile

| Nguyên tắc | Cách áp dụng |
|-----------|-------------|
| **Scan first** | QR scanner là action quan trọng nhất — nút to nhất, tab giữa |
| **3-tap rule** | Scan → chọn action → submit = 3 bước tối đa |
| **Pre-fill thông minh** | Ngày = hôm nay, vaccine = loại sắp hạn, khu = khu được assign |
| **Confirmation toast** | Sau mỗi lưu: toast nhỏ "✓ Đã lưu" — không modal |
| **Thumb zone** | Action buttons ở 2/3 dưới màn hình — tránh vùng trên khó chạm |
| **Role-aware** | Worker thấy form đơn giản; Vet thấy thêm diagnosis fields |

---

## Screen Map

```
/home                  → Home dashboard (role-based)
/scan                  → QR Scanner
/scan/result/[qrCode]  → Bottom sheet (inline, không route riêng)
/animals/[id]          → Animal detail (6 tabs)
/animals/[id]/log      → Quick form (weight/vaccine/disease/feed)
/zones                 → Danh sách zones
/zones/[id]            → Animals trong zone
/alerts                → Vaccination alerts
/more                  → Profile + extras (role-based)
```
