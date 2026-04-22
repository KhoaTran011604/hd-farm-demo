export const ANIMAL_SPECIES = ['heo', 'gà', 'bò'] as const;

export const SPECIES_LABELS: Record<string, string> = {
  heo: 'Lợn',
  gà: 'Gà',
  bò: 'Bò',
};

export const HEALTH_STATUSES = [
  'healthy',
  'monitoring',
  'sick',
  'quarantine',
  'recovered',
  'dead',
  'sold',
] as const;

export const HEALTH_STATUS_LABELS: Record<string, string> = {
  healthy: 'Khỏe mạnh',
  monitoring: 'Theo dõi',
  sick: 'Bệnh',
  quarantine: 'Cách ly',
  recovered: 'Hồi phục',
  dead: 'Chết',
  sold: 'Đã bán',
};
