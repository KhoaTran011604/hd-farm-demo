'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Syringe, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpcomingVaccinationsQuery } from '@/queries/alerts/queries';
import { formatDate } from '@/lib/utils';

function dueDateLabel(dueDate: string, tAlerts: ReturnType<typeof useTranslations>): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) return tAlerts('dueToday');
  if (diffDays === 1) return tAlerts('dueTomorrow');
  return tAlerts('dueDate', { date: formatDate(dueDate) });
}

export function UpcomingVaccinationsWidget(): React.JSX.Element {
  const tAlerts = useTranslations('alerts');
  const { data = [], isLoading } = useUpcomingVaccinationsQuery(undefined, 7);

  const topFive = data.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {tAlerts('upcomingVaccinations')}
        </CardTitle>
        <Syringe className="h-4 w-4 text-muted-foreground" />
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : topFive.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tAlerts('noUpcomingVaccinations')}</p>
        ) : (
          <ul className="space-y-2">
            {topFive.map((item, i) => (
              <li key={`${item.animalId}-${item.vaccineTypeId}-${i}`} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.animalName}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.vaccineName}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                  {dueDateLabel(item.dueDate, tAlerts)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
