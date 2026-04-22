# HD-FARM Design Guidelines

> Multi-tenant livestock management — Web Admin (Next.js + shadcn/ui) + Mobile App (Expo React Native)
> Font: **Be Vietnam Pro** (primary) / **Inter** (fallback) — both support Vietnamese diacritics

---

## 1. Color Palette

### Brand Colors

| Token                    | Hex       | Usage                                 |
| ------------------------ | --------- | ------------------------------------- |
| `--color-primary`        | `#2D5016` | Primary buttons, links, active states |
| `--color-primary-light`  | `#4A7C2F` | Hover states, secondary actions       |
| `--color-accent`         | `#7CB518` | Highlights, progress bars, badges     |
| `--color-bg`             | `#F8FAF5` | Page background                       |
| `--color-card`           | `#FFFFFF` | Card, modal, popover backgrounds      |
| `--color-sidebar`        | `#1A3009` | Sidebar/nav background (web)          |
| `--color-sidebar-text`   | `#C5E09B` | Sidebar nav labels                    |
| `--color-sidebar-active` | `#2D5016` | Active nav item bg                    |

### Text Colors

| Token                    | Hex       | Usage                    |
| ------------------------ | --------- | ------------------------ |
| `--color-text-primary`   | `#1A2E0A` | Headings, primary labels |
| `--color-text-secondary` | `#4B5563` | Body text, descriptions  |
| `--color-text-muted`     | `#9CA3AF` | Placeholder, disabled    |
| `--color-border`         | `#E5E7EB` | Dividers, input borders  |

### Status Colors (all 7)

| Status                  | Text      | Background | Tailwind class                  |
| ----------------------- | --------- | ---------- | ------------------------------- |
| Healthy / Khỏe mạnh     | `#16A34A` | `#DCFCE7`  | `text-green-600 bg-green-100`   |
| Monitoring / Theo dõi   | `#D97706` | `#FEF3C7`  | `text-amber-600 bg-amber-100`   |
| Sick / Bệnh             | `#DC2626` | `#FEE2E2`  | `text-red-600 bg-red-100`       |
| Quarantine / Cách ly    | `#EA580C` | `#FFEDD5`  | `text-orange-600 bg-orange-100` |
| Recovered / Đã hồi phục | `#2563EB` | `#DBEAFE`  | `text-blue-600 bg-blue-100`     |
| Dead / Chết             | `#6B7280` | `#F3F4F6`  | `text-gray-500 bg-gray-100`     |
| Sold / Đã bán           | `#9CA3AF` | `#F9FAFB`  | `text-gray-400 bg-gray-50`      |

---

## 2. Typography

### Font Loading (Google Fonts CDN)

```css
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
```

### Scale

| Role    | Font           | Size             | Weight | Line Height |
| ------- | -------------- | ---------------- | ------ | ----------- |
| Display | Be Vietnam Pro | 32px / 2rem      | 800    | 1.2         |
| H1      | Be Vietnam Pro | 24px / 1.5rem    | 700    | 1.3         |
| H2      | Be Vietnam Pro | 20px / 1.25rem   | 600    | 1.35        |
| H3      | Be Vietnam Pro | 16px / 1rem      | 600    | 1.4         |
| Body    | Be Vietnam Pro | 14px / 0.875rem  | 400    | 1.6         |
| Small   | Be Vietnam Pro | 12px / 0.75rem   | 400    | 1.5         |
| Label   | Be Vietnam Pro | 11px / 0.6875rem | 500    | 1.4         |
| Code/ID | Inter          | 13px / 0.8125rem | 500    | 1.4         |

### Vietnamese Typography Rules

- Always use `font-feature-settings: "kern" 1` for proper Vietnamese glyph rendering
- Minimum body size on mobile: **16px** (avoids browser auto-zoom)
- Line height for Vietnamese text: **1.6** (extra descenders/ascenders)

---

## 3. Spacing System

8px base grid. Only use values from this scale:

| Token      | px   | Tailwind         |
| ---------- | ---- | ---------------- |
| `space-1`  | 4px  | `p-1`, `gap-1`   |
| `space-2`  | 8px  | `p-2`, `gap-2`   |
| `space-3`  | 12px | `p-3`, `gap-3`   |
| `space-4`  | 16px | `p-4`, `gap-4`   |
| `space-5`  | 20px | `p-5`, `gap-5`   |
| `space-6`  | 24px | `p-6`, `gap-6`   |
| `space-8`  | 32px | `p-8`, `gap-8`   |
| `space-12` | 48px | `p-12`, `gap-12` |
| `space-16` | 64px | `p-16`, `gap-16` |

---

## 4. Border Radius

| Usage           | Value | Tailwind       |
| --------------- | ----- | -------------- |
| Buttons, inputs | 8px   | `rounded-lg`   |
| Cards           | 12px  | `rounded-xl`   |
| Badges, chips   | 4px   | `rounded`      |
| Modals, sheets  | 16px  | `rounded-2xl`  |
| Avatar, FAB     | 50%   | `rounded-full` |

---

## 5. Component Patterns

### Buttons

```
Primary:   bg-[#2D5016] text-white hover:bg-[#4A7C2F]  h-10 px-4 rounded-lg font-medium
Secondary: bg-white border border-[#2D5016] text-[#2D5016] hover:bg-[#F8FAF5]  h-10 px-4
Danger:    bg-red-600 text-white hover:bg-red-700
Ghost:     text-[#2D5016] hover:bg-[#F8FAF5]
```

- Min height: **40px** (web), **44px** (mobile)
- Loading state: show spinner, disable pointer events
- All buttons: `cursor-pointer transition-colors duration-200`

### Status Badges

```html
<span
  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
             text-green-600 bg-green-100"
>
  <span class="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
  Khỏe mạnh
</span>
```

- Dot indicator + label pattern for all 7 statuses
- Never rely on color alone — always include text label

### Cards

```
bg-white rounded-xl shadow-sm border border-gray-100 p-6
hover: shadow-md transition-shadow duration-200
```

### KPI Cards

```
Icon (32px, colored bg circle) + Label (12px muted) + Value (24px bold) + Delta (12px ±%)
```

### Data Tables (Web)

- Row height: **48px**
- Sticky header with `bg-gray-50 border-b`
- Alternating rows: white / `bg-[#F8FAF5]`
- Checkbox column: 40px width
- Sortable columns: chevron icon right of label
- Bulk action bar: slides in above table header when rows selected

### Forms

- Label above input (never placeholder-only)
- Input: `h-10 px-3 border border-gray-300 rounded-lg focus:border-[#4A7C2F] focus:ring-2 focus:ring-[#4A7C2F]/20`
- Error: red border + error message below (`text-red-600 text-xs mt-1`)
- Required: asterisk in primary green, not red

### Charts

- Primary line/bar: `#2D5016`
- Secondary: `#7CB518`
- Grid lines: `#E5E7EB`
- Axis labels: 11px, `#9CA3AF`
- Tooltips: white card, `shadow-lg`, 12px text

---

## 6. Sidebar (Web Admin)

```
Width: 240px (expanded) / 64px (collapsed)
Background: #1A3009
Top logo: 64px height zone
Nav item: h-11, px-4, gap-3, icon 20px, label 14px
Active item: bg-[#2D5016] rounded-lg mx-2
Hover: bg-white/10 rounded-lg mx-2
Text: #C5E09B  |  Active text: white
Divider: border-white/10
Bottom: user avatar + name + settings icon
```

### Nav Items

1. Tổng quan (Dashboard)
2. Đàn vật nuôi (Animals)
3. Lô/Batch (Batches)
4. Khu vực (Zones)
5. Sức khỏe (Health)
6. Tiêm vaccine (Vaccines)
7. Thức ăn (Feed)
8. Sinh sản (Reproduction)
9. Báo cáo (Reports)
10. Cài đặt (Settings)

---

## 7. Mobile-Specific Guidelines

### Touch Targets

- Minimum: **44 x 44px** for all interactive elements
- Adjacent targets: **8px minimum gap**
- FAB: **56px** diameter
- Bottom tab bar item: **min 44px height**

### Bottom Tab Bar

```
Height: 64px + safe area inset
Background: white, top border gray-200, shadow-top
5 tabs: Home | Animals | [FAB QR] | Alerts | Profile
FAB: 56px circle, bg-[#2D5016], center offset -16px from bar top
FAB icon: white QR scan icon 28px
```

### QR Scanner Overlay

```
Viewfinder: full screen black bg, 80% opacity outside scan zone
Scan zone: 240x240px centered white-cornered brackets (not full border)
Corner bracket: 3px stroke, white, 24px length arms
Scan line animation: green line sweeping top→bottom, 2s loop
```

```css
.scan-line {
  background: #7cb518;
  animation: scan 2s linear infinite;
}
@keyframes scan {
  0% {
    top: 0;
  }
  100% {
    top: 100%;
  }
}
```

### Bottom Sheet (post-scan result)

```
Drag handle at top center (36x4px, rounded, gray-300)
Border radius top: 20px
Slide-up animation: 300ms ease-out
Animal info header + 5 quick action buttons in horizontal scroll
```

---

## 8. shadcn/ui Customization (Tailwind CSS Variables)

In `globals.css` or `app/globals.css`:

```css
@layer base {
  :root {
    --background: 96 100% 97%; /* #F8FAF5 */
    --foreground: 100 52% 11%; /* #1A2E0A */
    --card: 0 0% 100%;
    --card-foreground: 100 52% 11%;
    --primary: 100 49% 20%; /* #2D5016 */
    --primary-foreground: 0 0% 100%;
    --secondary: 82 57% 40%; /* #4A7C2F */
    --secondary-foreground: 0 0% 100%;
    --accent: 79 77% 40%; /* #7CB518 */
    --accent-foreground: 0 0% 100%;
    --muted: 210 20% 96%;
    --muted-foreground: 215 16% 47%;
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 100 49% 20%;
    --radius: 0.5rem; /* 8px */
  }
}
```

### shadcn Component Notes

- `<Badge>` — add `variant="status-healthy|sick|monitoring|quarantine|recovered|dead|sold"` via `cva()`
- `<Table>` — set `--table-row-height: 48px` custom property
- `<Sidebar>` — use `collapsible="icon"` with custom dark background
- `<Button>` — default size maps to `h-10`; mobile overrides to `h-11 min-w-[44px]`

---

## 9. Elevation / Shadow Scale

| Level | CSS                           | Usage                  |
| ----- | ----------------------------- | ---------------------- |
| 0     | `none`                        | Flat elements          |
| 1     | `0 1px 3px rgba(0,0,0,.08)`   | Cards, inputs          |
| 2     | `0 4px 12px rgba(0,0,0,.10)`  | Dropdowns, hover cards |
| 3     | `0 8px 24px rgba(0,0,0,.12)`  | Modals, bottom sheets  |
| 4     | `0 16px 48px rgba(0,0,0,.16)` | Full-page overlays     |

---

## 10. Animation & Motion

```
Micro-interactions: 150ms ease
Page transitions: 200ms ease-out
Slide/Sheet open: 300ms ease-out
Chart draw: 600ms ease-in-out
Skeleton pulse: 1.5s ease-in-out infinite
```

Always check: `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; } }`

---

## 11. Iconography

- Library: **Lucide React** (web) / **lucide-react-native** (mobile)
- Size: 20px (nav/inline), 24px (buttons), 32px (KPI icons)
- Stroke width: 1.5px standard, 2px for emphasis
- Never use emojis as UI icons

---

## 12. Accessibility Checklist

- Color contrast: 4.5:1 normal text, 3:1 large text (WCAG AA)
- Focus rings: `outline: 2px solid #4A7C2F; outline-offset: 2px`
- Status badges never use color as the sole indicator
- All form inputs have visible `<label>` elements
- Tables have `<thead>` with `scope="col"` headers
- Icon-only buttons have `aria-label`
- Images have `alt` text
