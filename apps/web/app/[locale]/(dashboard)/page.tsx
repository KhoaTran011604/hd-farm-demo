import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Bird, Boxes, Wheat } from 'lucide-react';
import { UpcomingVaccinationsWidget } from '@/components/dashboard/upcoming-vaccinations-widget';

const STAT_ITEMS = [
  { key: 'animals', icon: Bird },
  { key: 'batches', icon: Boxes },
  { key: 'zones', icon: Wheat },
  { key: 'reports', icon: BarChart3 },
] as const;

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const t = await getTranslations('dashboard');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="text-muted-foreground text-sm">{t('subtitle')}</p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_ITEMS.map(({ key, icon: Icon }) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t(`stats.${key}`)}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">—</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <UpcomingVaccinationsWidget />
      </div>
    </div>
  );
}
