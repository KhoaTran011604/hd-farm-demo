# Web Admin UI/UX Flow — HD-FARM

**Date:** 2026-04-21 | **Stack:** Next.js 14 App Router + shadcn/ui + Tailwind

---

## Layout: Sidebar + Content

```
┌──────────────────────────────────────────────────────────────────┐
│  🌾 HD FARMS  │  Header / Breadcrumb              [🔔] [Avatar]  │
├───────────────┼──────────────────────────────────────────────────┤
│               │                                                  │
│  Sidebar Nav  │              Main Content                        │
│               │                                                  │
└───────────────┴──────────────────────────────────────────────────┘
```

### Sidebar Navigation

```
┌─────────────────┐
│  🌾 HD FARMS    │
│  [farm name]    │
├─────────────────┤
│ 📊 Dashboard    │
│ 🐄 Vật nuôi     │
│ 🏠 Khu nuôi     │
│ 📦 Lứa nuôi     │
│ 💉 Tiêm chủng   │
│ 🍽️  Khẩu phần   │
│ 🔬 Sức khỏe     │
│ 📈 Báo cáo      │
├─────────────────┤
│ ⚙️  Cài đặt     │
│   Loại vật nuôi │
│   Loại vaccine  │
│   Loại thức ăn  │
│   Người dùng    │
└─────────────────┘
```

---

## Page 1 — Dashboard (`/`)

```
┌──────────────────────────────────────────────────────────────────┐
│  Dashboard          Thứ 2, 21/04/2026         [🔔 3 alerts]      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐    │
│  │ Vật nuôi  │  │ Đang bệnh │  │ Tiêm hôm  │  │  Lứa     │    │
│  │           │  │           │  │    nay    │  │  đang    │    │
│  │  5,234    │  │    42     │  │    18     │  │  nuôi    │    │
│  │  con      │  │  ⚠️ +5 hm │  │ 💉 cần làm│  │    7     │    │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘    │
│                                                                  │
│  ┌─────────────────────────────┐  ┌───────────────────────────┐ │
│  │ ⚠️ Cần xử lý hôm nay        │  │  Phân bố trạng thái       │ │
│  ├─────────────────────────────┤  │                           │ │
│  │ 💉 Heo #A012 — Tiêm FMD    │  │  ● Khỏe      4,891 (93%) │ │
│  │    Khu A — Quá hạn 2 ngày  │  │  ● Theo dõi   198  (4%)  │ │
│  │ 💉 Bò #C034 — Tiêm LSD     │  │  ● Bệnh        42  (1%)  │ │
│  │ 🤒 Heo #B018 — Đang bệnh   │  │  ● Cách ly     18  (0%)  │ │
│  │    [Xem tất cả 18 mục →]   │  │  ● Đã bán     ...        │ │
│  └─────────────────────────────┘  └───────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Tổng quan khu nuôi                                          │ │
│  │                                                             │ │
│  │  Khu A         Khu B         Khu C         Khu D           │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │ │
│  │  │ 420/500  │  │ 380/400  │  │ 280/300  │  │ 510/600  │   │ │
│  │  │ Heo thịt │  │ Heo nái  │  │ Bò       │  │ Gà       │   │ │
│  │  │ ▓▓▓▓▓░   │  │ ▓▓▓▓▓▓▓▓│  │ ▓▓▓▓▓▓░  │  │ ▓▓▓▓▓▓░  │   │ │
│  │  │ 84%      │  │ 95% ⚠️   │  │ 93%      │  │ 85%      │   │ │
│  │  │ [2 bệnh] │  │ [0 bệnh] │  │ [1 bệnh] │  │ [0 bệnh] │   │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 📈 Tăng trọng trung bình — Lứa L2024-03 (Heo Khu A)       │  │
│  │  kg                                                         │  │
│  │  80 │                                          ____----    │  │
│  │  60 │                            ____-----‾‾‾‾            │  │
│  │  40 │             ___----‾‾‾‾‾‾‾‾                         │  │
│  │  20 │  ___---‾‾‾‾‾                                        │  │
│  │     └──────────────────────────────────── tuần            │  │
│  │        T1   T2   T3   T4   T5   T6   T7   T8              │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Component breakdown:**

- 4 summary cards (shadcn `Card`) — total, sick count, vaccine today, active batches
- Alert list (click → navigate to animal) — query: `vaccination_records.next_due_at <= today` + `animals.status IN (sick, quarantine)`
- Zone cards — capacity bar + sick badge
- Weight trend line chart (Recharts `LineChart`) — avg weight per week per active batch

---

## Page 2 — Danh Sách Vật Nuôi (`/animals`)

```
┌──────────────────────────────────────────────────────────────────┐
│  Vật nuôi              [+ Thêm mới]  [🖨️ In QR hàng loạt]       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🔍 Tìm tên, số hiệu...                                          │
│                                                                  │
│  Khu: [Tất cả ▼]  Loại: [Tất cả ▼]  Trạng thái: [Tất cả ▼]    │
│  Lứa: [Tất cả ▼]  Sắp tiêm: [□ 7 ngày tới]                     │
│                                                                  │
│  Đang hiển thị 5,234 kết quả  [□ Chọn tất cả]  [Bulk actions ▼] │
├───┬──────┬──────────┬──────┬────────┬───────────┬───────────────┤
│ ☐ │  #   │ Tên      │ Khu  │ Loại   │ Trạng thái│ Cân gần nhất  │
├───┼──────┼──────────┼──────┼────────┼───────────┼───────────────┤
│ ☐ │A-001 │    -     │ Khu A│ Heo    │ ✅ Khỏe   │ 82kg — 3 ngày │
│ ☐ │A-002 │ Hoa      │ Khu A│ Heo    │ ⚠️ Theo dõi│ 71kg — 1 ngày│
│ ☐ │A-003 │    -     │ Khu A│ Heo    │ 🔴 Bệnh   │ 68kg — 5 ngày │
│ ☐ │C-034 │ Vàng     │ Khu C│ Bò     │ ✅ Khỏe   │ 420kg — 7 ng  │
│   │ ...  │          │      │        │           │               │
├───┴──────┴──────────┴──────┴────────┴───────────┴───────────────┤
│  [← Trang trước]        1 / 105        [Trang sau →]            │
└──────────────────────────────────────────────────────────────────┘
```

**Bulk actions:** Đổi trạng thái / Gán lứa / In QR / Xuất Excel

**Filter behavior:**

- URL params: `/animals?zone=A&status=sick&type=pig`
- Cursor-based pagination (không dùng offset — 5000+ records)
- Debounced search (300ms)

**Status badge colors:**
| Status | Color |
|--------|-------|
| Khỏe | 🟢 green |
| Theo dõi | 🟡 yellow |
| Bệnh | 🔴 red |
| Cách ly | 🟠 orange |
| Hồi phục | 🔵 blue |
| Chết | ⚫ gray |
| Xuất bán | ⚪ muted |

---

## Page 3 — Chi Tiết Vật Nuôi (`/animals/[id]`)

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Vật nuôi / Khu A / Heo #A-003                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐   HEO #A-003                    🔴 ĐANG BỆNH      │
│  │          │   Khu A · Lứa L2024-03 · Heo thịt                 │
│  │  [QR]    │   Ngày nhập: 15/08/2024 · Ghi chú: con số 3        │
│  │          │                                                     │
│  │  [In QR] │   [✏️ Chỉnh sửa]  [🔄 Đổi trạng thái]  [➕ Thêm] │
│  └──────────┘                                                     │
│                                                                  │
│  ┌─────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ 68 kg   │  │ Tiêm tiếp:   │  │ Đang điều    │               │
│  │ 5 ngày  │  │ 25/04 (4ng)  │  │ trị: FMD     │               │
│  │ trước   │  │ 💉 FMD       │  │ Ngày 3/7     │               │
│  └─────────┘  └──────────────┘  └──────────────┘               │
│                                                                  │
│  [Tổng quan][Sức khỏe][Vaccine][Bệnh án][Thức ăn][Sinh sản]     │
│  ─────────────────── (tab: Bệnh án) ───────────────────────     │
│                                                                  │
│  Bệnh hiện tại                              [+ Ghi bệnh mới]    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 🔴 Lở mồm long móng (FMD)  ·  Mức độ: Vừa                 │  │
│  │    Phát hiện: 18/04/2026  ·  Bác sĩ: Nguyễn Văn A         │  │
│  │    Triệu chứng: sốt, loét miệng, chân                      │  │
│  │    ├── 💊 18/04: Amoxicillin 2g · 2 lần/ngày               │  │
│  │    └── 💊 20/04: Vitamin C bổ sung                         │  │
│  │    [+ Thêm điều trị]                                        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Lịch sử bệnh                                                    │
│  · 01/2026 — Tiêu chảy nhẹ · Đã khỏi · 3 ngày điều trị        │
└──────────────────────────────────────────────────────────────────┘
```

**6 tabs chi tiết:**

| Tab       | Nội dung                                                |
| --------- | ------------------------------------------------------- |
| Tổng quan | Thông tin cơ bản, stats nhanh, timeline sự kiện gần đây |
| Sức khỏe  | Line chart cân nặng + bảng lịch sử cân, BCS             |
| Vaccine   | Timeline dọc: ✅ đã tiêm / ⏳ sắp tiêm / ⚠️ quá hạn     |
| Bệnh án   | Bệnh hiện tại + lịch sử + treatments                    |
| Thức ăn   | Bar chart tiêu thụ theo ngày + FCR rolling 7 ngày       |
| Sinh sản  | Timeline sự kiện: phối giống → thai → sinh → cai sữa    |

**"Đổi trạng thái" flow:**

```
Click [🔄 Đổi trạng thái]
  → Modal: chọn status mới + note bắt buộc nếu đổi sang Bệnh/Cách ly
  → Confirm → PATCH /animals/:id/status
  → Badge cập nhật ngay (optimistic update)
```

**"➕ Thêm" dropdown:**

```
├── Ghi cân nặng
├── Ghi tiêm vaccine
├── Ghi bệnh
├── Ghi thức ăn
└── Ghi sự kiện sinh sản
```

---

## Page 4 — Quản Lý Lứa (`/batches` + `/batches/[id]`)

### Danh sách lứa (`/batches`)

```
┌──────────────────────────────────────────────────────────────────┐
│  Lứa nuôi                                    [+ Tạo lứa mới]    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ L2024-03 · Heo thịt Khu A               🟢 ĐANG NUÔI    │   │
│  │ Nhập: 15/08/2024  ·  Dự kiến xuất: 15/05/2026            │   │
│  │                                                           │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │   │
│  │  │ 418 con  │  │ 78.4 kg  │  │ FCR 2.8  │  │  0.5%   │ │   │
│  │  │ còn lại  │  │ TB hiện  │  │  ✅ tốt  │  │ tử vong │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │   │
│  │                                                           │   │
│  │  Tiến độ: nhập → [▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░] → xuất bán      │   │
│  │           15/08/24              hôm nay   15/05/26        │   │
│  │                                                           │   │
│  │  [Xem chi tiết]  [Xuất báo cáo]  [Đánh dấu hoàn thành]  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ L2025-01 · Gà Khu D                  ✅ HOÀN THÀNH       │   │
│  │ 01/01/2025 → 30/03/2025 · 510 con · FCR 1.9 · Xuất: 48T  │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Chi tiết lứa (`/batches/[id]`)

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Lứa nuôi / L2024-03                                          │
│                                                                  │
│  L2024-03 · Heo thịt · Khu A                   🟢 ĐANG NUÔI    │
│  15/08/2024 → 15/05/2026  ·  Nguồn: Trại Bình Dương            │
│                                                                  │
│  [Tổng quan] [Danh sách con] [Cân nặng] [Thức ăn / FCR] [Sức khỏe] │
│  ─────────────────── (tab: Tổng quan) ─────────────────────────  │
│                                                                  │
│  ┌──────────────────────────────────┐  ┌──────────────────────┐ │
│  │ Tăng trọng TB theo tuần          │  │ FCR theo tuần        │ │
│  │  kg                              │  │                      │ │
│  │  80 │              ___---        │  │  3.5│ ░░             │ │
│  │  60 │        ___---              │  │  3.0│ ░░▓░           │ │
│  │  40 │  ___---                    │  │  2.5│ ▓▓▓▓▓▓▓        │ │
│  │     └─────────── tuần            │  │     └────────        │ │
│  │       T1  T3  T5  T7  T9        │  │      T1 T3 T5 T7 T9  │ │
│  └──────────────────────────────────┘  └──────────────────────┘ │
│                                                                  │
│  Trạng thái đàn                                                  │
│  ● Khỏe 95%   ● Theo dõi 3%   ● Bệnh 1%   ● Tử vong 0.5%      │
└──────────────────────────────────────────────────────────────────┘
```

**FCR badge logic:**

```
FCR < 2.5  → 🟢 Xuất sắc
FCR 2.5-3  → 🟡 Tốt
FCR 3-3.5  → 🟠 Cần cải thiện
FCR > 3.5  → 🔴 Kém
```

---

## Routing Map

```
/                             → Dashboard
/animals                      → Danh sách vật nuôi
/animals/[id]                 → Chi tiết vật nuôi
/animals/new                  → Thêm mới
/zones                        → Khu nuôi
/zones/[id]                   → Chi tiết khu
/batches                      → Lứa nuôi
/batches/[id]                 → Chi tiết lứa
/vaccinations                 → Lịch tiêm chủng
/health                       → Sức khỏe tổng hợp
/reports                      → Báo cáo
/settings/animal-types        → Cấu hình loại vật nuôi
/settings/vaccines            → Cấu hình vaccine
/settings/feeds               → Cấu hình thức ăn
/settings/users               → Quản lý người dùng
```

---

## Key UX Principles

1. **Status-first**: Badge màu sắc rõ ràng trên mọi trang — nhìn một cái biết ngay tình trạng
2. **Alert-driven**: Dashboard luôn show việc cần làm hôm nay — không cần tìm kiếm
3. **Click depth tối đa 2**: Từ Dashboard → Animal Detail chỉ 1 click
4. **Optimistic updates**: Đổi status, thêm record hiển thị ngay, không cần reload
5. **Printer-friendly QR**: Mọi trang animal đều có nút in QR rõ ràng
