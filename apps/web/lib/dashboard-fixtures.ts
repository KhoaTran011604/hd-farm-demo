import type { DashboardAlertItem } from '@/components/dashboard/alerts-panel';
import type { DonutSegment } from '@/components/dashboard/status-donut';
import type { ZoneCapacityRow } from '@/components/dashboard/zone-capacity-card';

export const DASHBOARD_ALERTS: DashboardAlertItem[] = [
  {
    id: '1',
    dot: 'red',
    title: 'Heo #A-012 có triệu chứng bất thường',
    desc: 'Khu A · Bỏ ăn, sốt 40.2°C',
    time: '08:15',
  },
  {
    id: '2',
    dot: 'red',
    title: '3 con heo Khu B cần tái khám',
    desc: 'Khu B · Hết liệu trình điều trị',
    time: '07:50',
  },
  {
    id: '3',
    dot: 'amber',
    title: 'Vaccine FMD — 38 con chưa tiêm',
    desc: 'Khu A, C · Hạn hôm nay',
    time: '07:30',
  },
  {
    id: '4',
    dot: 'amber',
    title: 'Lô B-2026-03 sắp đủ tuổi xuất chuồng',
    desc: 'Khu B · Còn 3 ngày',
    time: '06:00',
  },
  {
    id: '5',
    dot: 'blue',
    title: 'Lịch cân định kỳ — Khu C',
    desc: 'Khu C · Thứ Sáu này, 64 con',
    time: 'Hôm qua',
  },
];

export function getStatusSegments(labelFn: (key: string) => string): DonutSegment[] {
  return [
    { key: 'healthy', label: labelFn('healthy'), count: 974, color: '#16A34A' },
    { key: 'monitoring', label: labelFn('monitoring'), count: 87, color: '#D97706' },
    { key: 'sick', label: labelFn('sick'), count: 62, color: '#DC2626' },
    { key: 'quarantine', label: labelFn('quarantine'), count: 37, color: '#EA580C' },
    { key: 'recovered', label: labelFn('recovered'), count: 62, color: '#2563EB' },
    { key: 'sold', label: labelFn('sold'), count: 26, color: '#6B7280' },
  ];
}

export const ZONE_CAPACITY_ROWS: ZoneCapacityRow[] = [
  {
    id: 'A',
    name: 'Khu A',
    typeLabel: 'Heo thịt',
    current: 312,
    capacity: 400,
    sick: 8,
  },
  {
    id: 'B',
    name: 'Khu B',
    typeLabel: 'Heo nái',
    current: 198,
    capacity: 200,
    monitoring: 3,
  },
  {
    id: 'C',
    name: 'Khu C',
    typeLabel: 'Heo con',
    current: 487,
    capacity: 600,
  },
  {
    id: 'D',
    name: 'Khu D',
    typeLabel: 'Cách ly',
    current: 37,
    capacity: 50,
    quarantine: 37,
  },
];

export const WEIGHT_TREND_POINTS: { date: string; weight: number }[] = [
  { date: '24/3', weight: 68 },
  { date: '27/3', weight: 69.5 },
  { date: '30/3', weight: 71 },
  { date: '2/4', weight: 72.8 },
  { date: '5/4', weight: 74.5 },
  { date: '8/4', weight: 76 },
  { date: '11/4', weight: 78 },
  { date: '14/4', weight: 80.5 },
  { date: '17/4', weight: 83 },
  { date: '20/4', weight: 86 },
  { date: '22/4', weight: 88.4 },
];
