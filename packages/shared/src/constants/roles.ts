export const USER_ROLES = ['super_admin', 'admin', 'manager', 'worker'] as const;

export const USER_ROLE_LABELS: Record<string, string> = {
  super_admin: 'Quản trị hệ thống',
  admin: 'Quản trị viên',
  manager: 'Quản lý',
  worker: 'Nhân viên',
};

export const FARM_ROLES = ['manager', 'worker'] as const;
