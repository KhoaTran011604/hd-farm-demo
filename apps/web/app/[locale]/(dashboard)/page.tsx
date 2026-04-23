import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Bird, Boxes, Wheat } from 'lucide-react';

const PLACEHOLDER_STATS = [
  { label: 'Tổng vật nuôi', value: '—', icon: Bird },
  { label: 'Lô chăn nuôi', value: '—', icon: Boxes },
  { label: 'Khu vực', value: '—', icon: Wheat },
  { label: 'Báo cáo', value: '—', icon: BarChart3 },
];

export default function DashboardPage(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground text-sm">Tổng quan sẽ được bổ sung ở Phase 12.</p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {PLACEHOLDER_STATS.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
