import { getTranslations } from 'next-intl/server';
import { Activity, Bird, Boxes, Syringe } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { AlertsPanel } from '@/components/dashboard/alerts-panel';
import { StatusDonut } from '@/components/dashboard/status-donut';
import { ZoneCapacityCard } from '@/components/dashboard/zone-capacity-card';
import { WeightTrendChart } from '@/components/dashboard/weight-trend-chart';
import {
  DASHBOARD_ALERTS,
  ZONE_CAPACITY_ROWS,
  WEIGHT_TREND_POINTS,
  getStatusSegments,
} from '@/lib/dashboard-fixtures';

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const t = await getTranslations('dashboard');
  const tStatus = await getTranslations('animals.status');
  const tZone = await getTranslations('dashboard.zoneCapacity');

  const now = new Date();
  const time = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const segments = getStatusSegments((key) => tStatus(key));
  const total = segments.reduce((acc, s) => acc + s.count, 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A2E0A]">{t('title')}</h1>
          <p className="mt-0.5 text-[13px] text-[#9CA3AF]">{t('lastUpdated', { time })}</p>
        </div>
        <div className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#4B5563]">
          {dateStr}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Bird}
          iconBg="#DCFCE7"
          iconColor="#16A34A"
          value={total.toLocaleString()}
          label={t('kpi.totalAnimals')}
          delta={{ text: '+2.4%', direction: 'up' }}
        />
        <KpiCard
          icon={Activity}
          iconBg="#FEE2E2"
          iconColor="#DC2626"
          value={14}
          label={t('kpi.sick')}
          delta={{ text: '+3', direction: 'down' }}
        />
        <KpiCard
          icon={Syringe}
          iconBg="#DBEAFE"
          iconColor="#2563EB"
          value={38}
          label={t('kpi.vaccineToday')}
          delta={{ text: t('kpi.today'), direction: 'neutral' }}
        />
        <KpiCard
          icon={Boxes}
          iconBg="#FEF3C7"
          iconColor="#D97706"
          value={6}
          label={t('kpi.activeBatches')}
          delta={{ text: t('kpi.active'), direction: 'up' }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <AlertsPanel items={DASHBOARD_ALERTS} />
        <StatusDonut segments={segments} total={total} />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[15px] font-bold text-[#1A2E0A]">{tZone('title')}</div>
          <button
            type="button"
            className="text-xs font-semibold text-primary-light hover:text-primary"
          >
            {tZone('manage')}
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ZONE_CAPACITY_ROWS.map((zone) => (
            <ZoneCapacityCard key={zone.id} zone={zone} />
          ))}
        </div>
      </div>

      <WeightTrendChart points={WEIGHT_TREND_POINTS} />
    </div>
  );
}
