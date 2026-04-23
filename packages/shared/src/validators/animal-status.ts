import type { HealthStatus } from '../types/animal.js';

const TRANSITIONS: Record<HealthStatus, HealthStatus[]> = {
  healthy:    ['monitoring', 'sick', 'quarantine', 'dead', 'sold'],
  monitoring: ['healthy', 'sick', 'quarantine', 'dead', 'sold'],
  sick:       ['monitoring', 'quarantine', 'recovered', 'dead', 'sold'],
  quarantine: ['sick', 'monitoring', 'recovered', 'dead', 'sold'],
  recovered:  ['healthy', 'monitoring', 'dead', 'sold'],
  dead:       [],
  sold:       [],
};

export const TERMINAL_STATUSES: HealthStatus[] = ['dead', 'sold'];

export function canTransition(from: HealthStatus, to: HealthStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export { TRANSITIONS };
