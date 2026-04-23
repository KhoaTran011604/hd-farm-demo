import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/queries/keys';

interface WorkerTask {
  animalId: string;
  animalName: string;
  species: string;
  status: string;
  qrCode: string;
  penName?: string;
  zoneName?: string;
  action: string;
}

interface WorkerData {
  tasks: WorkerTask[];
  totalAnimals: number;
}

interface RecentEvent {
  animalId: string;
  animalName: string;
  species: string;
  status: string;
  updatedAt: string;
  penName?: string;
  zoneName?: string;
}

interface ManagerData {
  totalAnimals: number;
  healthyAnimals: number;
  sickAnimals: number;
  monitoringAnimals: number;
  alertsCount: number;
  recentEvents: RecentEvent[];
}

export function useWorkerDashboardQuery(enabled: boolean) {
  return useQuery<WorkerData>({
    queryKey: queryKeys.dashboard.tasks,
    queryFn: () => api.get('/dashboard/my-tasks').then((r) => r.data as WorkerData),
    enabled,
  });
}

export function useManagerDashboardQuery(enabled: boolean) {
  return useQuery<ManagerData>({
    queryKey: queryKeys.dashboard.overview,
    queryFn: () => api.get('/dashboard/overview').then((r) => r.data as ManagerData),
    enabled,
  });
}
