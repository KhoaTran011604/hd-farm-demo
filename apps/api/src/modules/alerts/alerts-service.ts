import { sql } from 'drizzle-orm';
import type { Database } from '@hd-farm/db';

export interface UpcomingVaccination {
  animalId: string;
  animalName: string;
  species: string;
  vaccineTypeId: string;
  vaccineName: string;
  dueDate: Date;
}

export interface PaginatedVaccinations {
  items: UpcomingVaccination[];
  total: number;
  nextOffset?: number;
}

export async function getUpcomingVaccinations(
  db: Database,
  companyId: string,
  farmId?: string,
  days = 7,
  limit = 200,
  offset = 0,
): Promise<PaginatedVaccinations> {
  const farmFilter = farmId
    ? sql`AND a.farm_id = ${farmId}`
    : sql``;

  const dateCondition = sql`
    COALESCE(
      MAX(vr.next_due_at),
      MAX(vr.vaccinated_at) + vt.interval_days * INTERVAL '1 day',
      NOW()
    ) BETWEEN NOW() - INTERVAL '1 day' AND NOW() + ${days} * INTERVAL '1 day'
  `;

  const totalResult = await db.execute<{ count: number }>(sql`
    SELECT COUNT(*) AS count
    FROM animals a
    JOIN vaccine_types vt ON vt.species = a.species
    LEFT JOIN vaccination_records vr
      ON vr.animal_id = a.id
      AND vr.vaccine_type_id = vt.id
    WHERE
      a.company_id = ${companyId}
      AND a.deleted_at IS NULL
      AND a.status NOT IN ('dead', 'sold')
      AND vt.interval_days IS NOT NULL
      ${farmFilter}
    GROUP BY a.id, a.name, a.species, vt.id, vt.name, vt.interval_days
    HAVING ${dateCondition}
  `);

  const total = Array.from(totalResult).length;

  const result = await db.execute<{
    animal_id: string;
    animal_name: string;
    species: string;
    vaccine_type_id: string;
    vaccine_name: string;
    due_date: Date;
  }>(sql`
    SELECT
      a.id           AS animal_id,
      a.name         AS animal_name,
      a.species      AS species,
      vt.id          AS vaccine_type_id,
      vt.name        AS vaccine_name,
      COALESCE(
        MAX(vr.next_due_at),
        MAX(vr.vaccinated_at) + vt.interval_days * INTERVAL '1 day',
        NOW()
      )              AS due_date
    FROM animals a
    JOIN vaccine_types vt ON vt.species = a.species
    LEFT JOIN vaccination_records vr
      ON vr.animal_id = a.id
      AND vr.vaccine_type_id = vt.id
    WHERE
      a.company_id = ${companyId}
      AND a.deleted_at IS NULL
      AND a.status NOT IN ('dead', 'sold')
      AND vt.interval_days IS NOT NULL
      ${farmFilter}
    GROUP BY a.id, a.name, a.species, vt.id, vt.name, vt.interval_days
    HAVING ${dateCondition}
    ORDER BY due_date ASC
    LIMIT ${limit}
    OFFSET ${offset}
  `);

  const items = Array.from(result).map((r) => ({
    animalId: r.animal_id,
    animalName: r.animal_name,
    species: r.species,
    vaccineTypeId: r.vaccine_type_id,
    vaccineName: r.vaccine_name,
    dueDate: r.due_date,
  }));

  return {
    items,
    total,
    nextOffset: items.length === limit ? offset + limit : undefined,
  };
}
