# Agricultural Livestock Management Dashboard - Design System Brief

**Date:** 2026-04-22 | **Status:** Research Complete

---

## Color System

### Primary & Semantic Colors
- **Primary (Brand)**: `#2D5016` (Forest Green) - Growth, health, agriculture
- **Secondary**: `#6B8E23` (Olive Green) - Supporting actions
- **Success/Healthy**: `#22C55E` (Green) - Animal healthy, normal status
- **Warning/Monitoring**: `#EAB308` (Amber) - Alert required, observation needed
- **Critical/Sick**: `#EF4444` (Red) - Urgent intervention needed
- **Neutral/Info**: `#3B82F6` (Blue) - Information, monitoring data
- **Neutral/Disabled**: `#9CA3AF` (Gray) - Inactive, historical data

### Neutral Palette
- **Text Primary**: `#1F2937` (Gray-900) - High contrast for readability
- **Text Secondary**: `#6B7280` (Gray-600) - Muted labels, secondary info
- **Backgrounds**: `#FFFFFF` (White) - Clean, calm interface
- **Surface**: `#F9FAFB` (Gray-50) - Card backgrounds, containers
- **Border**: `#E5E7EB` (Gray-200) - Subtle divisions

### Usage Rules
- Status colors follow livestock health monitoring: Green (healthy) → Amber (monitoring) → Red (sick)
- Always pair color with icons/text for colorblind accessibility
- Use semantic colors consistently across web & mobile

---

## Typography

### Fonts
1. **Be Vietnam Pro** (Primary)
   - Neo-grotesque, Vietnamese-optimized, excellent screen readability
   - All headings, labels, dense data tables
   - Weights: Regular (400), Medium (500), Bold (700)

2. **Inter** (Fallback/Body)
   - Highly legible sans-serif for secondary content
   - Weights: Regular (400), Medium (500)

### Font Sizing Scale
- **Display**: 32px / 40px (Dashboard titles)
- **Heading 1**: 24px (Page titles)
- **Heading 2**: 20px (Section headers, status labels)
- **Body Large**: 16px (Primary text, table data)
- **Body Regular**: 14px (Form fields, descriptions)
- **Caption**: 12px (Metadata, timestamps)
- **Overline**: 11px (Legend labels)

### Line Heights
- Headings: 1.2
- Body text: 1.5
- Captions: 1.4

---

## Spacing & Layout

### 8px Grid System
- **Micro**: 2px, 4px (Borders, subtle separations)
- **Small**: 8px, 12px (Component padding, tight layouts)
- **Medium**: 16px, 24px (Section spacing, card gaps)
- **Large**: 32px, 40px (Page sections, major divisions)
- **XLarge**: 48px, 64px (Hero spacing, top-level sections)

### Component Spacing
- **Button/Input Height**: 44px (Mobile touch target minimum)
- **Card Padding**: 16px or 24px (Inside content)
- **Gap Between Cards**: 16px
- **Border Radius**: 8px (All interactive elements), 4px (Subtle elements)

### Data Table Rules
- **Row Height**: 48px minimum (touch-friendly)
- **Column Padding**: 12px horizontal
- **Header Weight**: Bold (600+)
- **Status Badge Height**: 24px, 32px padding horizontal

---

## Design Patterns

### Status Badges
```
Healthy  → Green (#22C55E) + ✓ icon + "Healthy" text
Monitoring → Amber (#EAB308) + ⚠ icon + "Monitoring" text
Sick → Red (#EF4444) + ✗ icon + "Sick" text
```

### Progress Indicators
- Use green-to-amber-to-red gradient for livestock condition progression
- Circular progress for tasks/monitoring (24px-48px diameter)
- Linear progress for time-based metrics (4px-8px height)

### Data Visualization
- Line charts: Use primary green for trends, secondary colors for comparison
- Heatmaps: Green (normal) → Yellow (elevated) → Red (critical)
- Icons: Simple, monochromatic, 20px-24px standard size

### Mobile Touch Targets
- Buttons: 44×44px minimum (WCAG AAA standard)
- Touch spacing: 8px gap between interactive elements
- Form fields: 44px height for inputs
- Avoid placing critical actions in bottom 44px (thumb zone consideration)

---

## Dashboard Layout Patterns

### Web Layout
- Sidebar: 240px (collapsible to 64px)
- Content area: Responsive grid (12-16 column)
- Card-based layouts: 2-4 cards per row (1280px+)
- Padding: 24px outer margins

### Mobile Layout
- Full-width cards with 16px padding
- Stacked metrics (1 per row)
- Bottom navigation bar for primary actions
- Status colors remain consistent but larger badge sizes (32px)

---

## Implementation References

**Design Resources:**
- [Agriculture Design System - Status Badge Pattern](https://design-system.agriculture.gov.au/components/status-badge)
- [Figma Dashboard Design System Templates](https://www.figma.com/templates/dashboard-designs/)
- [Dribbble Agricultural Dashboard Inspirations](https://dribbble.com/search/agriculture-dashboard-ui)
- [Be Vietnam Pro Font](https://fonts.google.com/specimen/Be%2BVietnam%2BPro)

**Real Product References:**
- Farmbrite: Cloud-based farm management with dynamic dashboards
- CowManager: Livestock health monitoring with color-coded alerts

---

## Accessibility Checklist
- [ ] All interactive elements ≥44×44px
- [ ] Color + icon/text for status differentiation
- [ ] Minimum contrast ratio 4.5:1 (body text vs. background)
- [ ] Vietnamese diacritics render correctly in Be Vietnam Pro
- [ ] Mobile bottom touch zone avoids critical controls

---

**Next Steps:** Validate color contrast ratios, test typography on real devices, create Figma component library with spacing grid.
